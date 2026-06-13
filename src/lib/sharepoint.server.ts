import * as XLSX from "xlsx";
import {
  type CentroCusto,
  type MapeamentoColunas,
  autoDetectarMapeamento,
  montarCentrosComMapeamento,
} from "./rateio-data";

/**
 * URL pública (link "Qualquer pessoa com o link") da planilha de rateio
 * hospedada no SharePoint. Esta é a ÚNICA fonte oficial de dados.
 */
export const PLANILHA_URL =
  "https://medicar365-my.sharepoint.com/:x:/g/personal/bruno_paiva_medicar_com_br/IQD5B5-ao6rvSYOQGVenP0jZASoT5oYPcU_dFjm7pxe9nUA?e=pzMzvA&download=1";

export interface RateioPayload {
  centros: CentroCusto[];
  lastSync: string;
  totalLinhas: number;
  totalCentros: number;
  totalNotebooks: number;
  sheetName: string;
  colunasIdentificadas: string[];
  mapeamento: MapeamentoColunas;
  arquivo: string;
}

/**
 * Baixa o arquivo do SharePoint seguindo manualmente o redirect 302
 * para preservar o cookie FedAuth de sessão anônima.
 */
async function baixarPlanilha(): Promise<ArrayBuffer> {
  const r1 = await fetch(PLANILHA_URL, { redirect: "manual" });
  if (r1.status !== 302 && r1.status !== 301) {
    if (r1.status === 200) return await r1.arrayBuffer();
    throw new Error(
      `Falha ao acessar o SharePoint (HTTP ${r1.status}). Verifique se o link público continua válido.`,
    );
  }

  const loc = r1.headers.get("location");
  if (!loc) throw new Error("SharePoint retornou redirecionamento sem cabeçalho Location.");

  const setCookies =
    typeof (r1.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === "function"
      ? (r1.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
      : [r1.headers.get("set-cookie") ?? ""];

  const cookie = setCookies
    .filter(Boolean)
    .map((c) => c.split(";")[0])
    .join("; ");

  if (!cookie) {
    throw new Error("SharePoint não retornou cookie de sessão anônima — o link pode ter expirado.");
  }

  const base = new URL(PLANILHA_URL);
  const next = new URL(loc, base.origin).toString();
  const r2 = await fetch(next, { headers: { cookie }, redirect: "follow" });

  if (!r2.ok) {
    throw new Error(
      `Falha ao baixar o arquivo (HTTP ${r2.status}). O link de compartilhamento pode estar expirado ou as permissões mudaram.`,
    );
  }

  const ct = r2.headers.get("content-type") ?? "";
  const buf = await r2.arrayBuffer();
  if (!ct.includes("spreadsheetml") && buf.byteLength < 1024) {
    throw new Error(
      `Resposta inesperada do SharePoint (content-type: ${ct}). Confirme que o link continua compartilhado como "Qualquer pessoa com o link".`,
    );
  }
  return buf;
}

export async function carregarRateioDoSharePoint(): Promise<RateioPayload> {
  const buf = await baixarPlanilha();
  const wb = XLSX.read(buf, { type: "array" });

  // Seleciona a primeira aba que tenha dados
  let sheetName = wb.SheetNames[0];
  let linhas: Record<string, unknown>[] = [];
  let colunas: string[] = [];

  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
    if (rows.length > 0) {
      sheetName = name;
      linhas = rows;
      colunas = Object.keys(rows[0] ?? {}).filter((c) => !c.startsWith("__EMPTY"));
      break;
    }
  }

  if (linhas.length === 0) {
    throw new Error("A planilha foi baixada mas não contém linhas de dados em nenhuma aba.");
  }

  const mapeamento = autoDetectarMapeamento(colunas);

  const camposObrigatorios: (keyof MapeamentoColunas)[] = ["serie", "nome", "valor"];
  const faltando = camposObrigatorios.filter((c) => !mapeamento[c]);
  if (faltando.length > 0) {
    throw new Error(
      `Colunas obrigatórias não encontradas na planilha: ${faltando.join(", ")}. ` +
        `Colunas presentes: ${colunas.join(", ")}.`,
    );
  }

  const resultado = montarCentrosComMapeamento(linhas, mapeamento);

  return {
    centros: resultado.centros,
    lastSync: new Date().toISOString(),
    totalLinhas: resultado.totalLinhas,
    totalCentros: resultado.totalCentros,
    totalNotebooks: resultado.totalNotebooks,
    sheetName,
    colunasIdentificadas: colunas,
    mapeamento,
    arquivo: "RATEIO SOFFNER 06-2026.xlsx",
  };
}
