import * as XLSX from "xlsx";
import type { CentroCusto, Notebook, RateioPayload } from "../rateio-types";
import { baixarPlanilhaSharePoint, toNumber } from "../sharepoint-download.server";

export const SOFFNER_PLANILHA_URL =
  "https://medicar365-my.sharepoint.com/:x:/g/personal/bruno_paiva_medicar_com_br/IQD66DyQfYA4TadrXvPsTjP8AbUZVuC7jWe3XFJMH_KSuQw?e=tDRjfX&download=1";
export const SOFFNER_SHEET_NAME = "D21882";

const COL = {
  serie: "N.Série",
  valor: "VALOR_UNIT",
  percentual: "PERCENTUAL",
  centro: "CENTRO_CUSTO",
  cidade: "CIDADE",
  nome: "NOME",
} as const;

export async function carregarRateioSoffner(): Promise<RateioPayload> {
  const buf = await baixarPlanilhaSharePoint(SOFFNER_PLANILHA_URL);
  const wb = XLSX.read(buf, { type: "array" });

  if (!wb.SheetNames.includes(SOFFNER_SHEET_NAME)) {
    throw new Error(
      `A aba oficial "${SOFFNER_SHEET_NAME}" não foi encontrada na planilha. Abas presentes: ${wb.SheetNames.join(", ")}.`,
    );
  }

  const ws = wb.Sheets[SOFFNER_SHEET_NAME];
  const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
  const colunas =
    linhas.length > 0
      ? Object.keys(linhas[0]).filter((column) => !column.startsWith("__EMPTY"))
      : [];

  const faltando = Object.values(COL).filter((column) => !colunas.includes(column));
  if (faltando.length > 0) {
    throw new Error(
      `Colunas obrigatórias ausentes na aba "${SOFFNER_SHEET_NAME}": ${faltando.join(", ")}. ` +
        `Colunas encontradas: ${colunas.join(", ")}.`,
    );
  }

  const map = new Map<string, CentroCusto>();
  let totalNotebooks = 0;

  for (const linha of linhas) {
    const centro = String(linha[COL.centro] ?? "").trim();
    if (!centro) continue;

    const percentualBruto = toNumber(linha[COL.percentual]);
    const percentual = percentualBruto <= 1 ? percentualBruto * 100 : percentualBruto;
    const notebook: Notebook = {
      colaborador: String(linha[COL.nome] ?? "").trim() || "—",
      serie: String(linha[COL.serie] ?? "").trim() || "—",
      cidade: String(linha[COL.cidade] ?? "").trim() || "—",
      valorMensal: toNumber(linha[COL.valor]),
      percentual,
    };

    if (!map.has(centro)) {
      map.set(centro, { id: centro, codigo: centro, nome: centro, notebooks: [] });
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
    sheetName: SOFFNER_SHEET_NAME,
    colunasIdentificadas: colunas,
    arquivo: "RATEIO SOFFNER (SharePoint)",
  };
}
