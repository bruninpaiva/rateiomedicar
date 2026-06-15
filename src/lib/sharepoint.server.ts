import * as XLSX from "xlsx";
import type { CentroCusto, Notebook } from "./rateio-data";

/** Link público (anonymous) da NOVA planilha oficial. */
export const PLANILHA_URL =
  "https://medicar365-my.sharepoint.com/:x:/g/personal/bruno_paiva_medicar_com_br/IQD66DyQfYA4TadrXvPsTjP8AbUZVuC7jWe3XFJMH_KSuQw?e=tDRjfX&download=1";

/** Aba ÚNICA e oficial. Qualquer outra aba é ignorada. */
export const SHEET_NAME = "D21882";

/** Colunas EXATAS esperadas na aba D21882. */
const COL = {
  serie: "N.Série",
  valor: "VALOR_UNIT",
  percentual: "PERCENTUAL",
  centro: "CENTRO_CUSTO",
  cidade: "CIDADE",
  nome: "NOME",
} as const;

export interface RateioPayload {
  centros: CentroCusto[];
  lastSync: string;
  totalLinhas: number;
  totalCentros: number;
  totalNotebooks: number;
  sheetName: string;
  colunasIdentificadas: string[];
  arquivo: string;
}

async function baixarPlanilha(): Promise<ArrayBuffer> {
  const r1 = await fetch(PLANILHA_URL, { redirect: "manual" });
  if (r1.status === 200) return await r1.arrayBuffer();
  if (r1.status !== 301 && r1.status !== 302) {
    throw new Error(`Falha ao acessar o SharePoint (HTTP ${r1.status}).`);
  }
  const loc = r1.headers.get("location");
  if (!loc) throw new Error("SharePoint retornou redirect sem header Location.");
  const h = r1.headers as Headers & { getSetCookie?: () => string[] };
  const setCookies = typeof h.getSetCookie === "function"
    ? h.getSetCookie()
    : [r1.headers.get("set-cookie") ?? ""];
  const cookie = setCookies.filter(Boolean).map((c) => c.split(";")[0]).join("; ");
  if (!cookie) throw new Error("SharePoint não retornou cookie de sessão anônima.");
  const next = new URL(loc, new URL(PLANILHA_URL).origin).toString();
  const r2 = await fetch(next, { headers: { cookie }, redirect: "follow" });
  if (!r2.ok) throw new Error(`Falha ao baixar o arquivo (HTTP ${r2.status}).`);
  return await r2.arrayBuffer();
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const s = v.replace(/[R$\s.]/g, "").replace(",", ".").replace("%", "");
    const n = Number(s);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

export async function carregarRateioDoSharePoint(): Promise<RateioPayload> {
  const buf = await baixarPlanilha();
  const wb = XLSX.read(buf, { type: "array" });

  if (!wb.SheetNames.includes(SHEET_NAME)) {
    throw new Error(
      `A aba oficial "${SHEET_NAME}" não foi encontrada na planilha. Abas presentes: ${wb.SheetNames.join(", ")}.`,
    );
  }

  const ws = wb.Sheets[SHEET_NAME];
  const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
  const colunas = linhas.length > 0
    ? Object.keys(linhas[0]).filter((c) => !c.startsWith("__EMPTY"))
    : [];

  // Valida que as colunas esperadas estão presentes
  const faltando = Object.values(COL).filter((c) => !colunas.includes(c));
  if (faltando.length > 0) {
    throw new Error(
      `Colunas obrigatórias ausentes na aba "${SHEET_NAME}": ${faltando.join(", ")}. ` +
        `Colunas encontradas: ${colunas.join(", ")}.`,
    );
  }

  // Agrupa EXCLUSIVAMENTE pela coluna CENTRO_CUSTO (texto literal).
  const map = new Map<string, CentroCusto>();
  let totalNotebooks = 0;

  for (const linha of linhas) {
    const centro = String(linha[COL.centro] ?? "").trim();
    if (!centro) continue; // ignora linhas sem centro de custo

    const percentualBruto = toNumber(linha[COL.percentual]);
    // Planilha grava percentual em decimal (0,20 = 20%). Converte para exibição em %.
    const percentual = percentualBruto <= 1 ? percentualBruto * 100 : percentualBruto;

    const notebook: Notebook = {
      colaborador: String(linha[COL.nome] ?? "").trim() || "—",
      serie: String(linha[COL.serie] ?? "").trim() || "—",
      cidade: String(linha[COL.cidade] ?? "").trim() || "—",
      valorMensal: toNumber(linha[COL.valor]),
      percentual,
    };

    if (!map.has(centro)) {
      map.set(centro, { codigo: centro, nome: centro, notebooks: [] });
    }
    map.get(centro)!.notebooks.push(notebook);
    totalNotebooks++;
  }

  const centros = Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));

  return {
    centros,
    lastSync: new Date().toISOString(),
    totalLinhas: linhas.length,
    totalCentros: centros.length,
    totalNotebooks,
    sheetName: SHEET_NAME,
    colunasIdentificadas: colunas,
    arquivo: "RATEIO SOFFNER (SharePoint)",
  };
}
