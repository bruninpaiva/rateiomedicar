import * as XLSX from "xlsx";
import type { CentroCusto, Notebook, RateioPayload } from "../rateio-types";
import { baixarPlanilhaSharePoint, toNumber } from "../sharepoint-download.server";

export const ARKLOK_PLANILHA_URL =
  "https://medicar365-my.sharepoint.com/:x:/g/personal/bruno_paiva_medicar_com_br/IQB-hG1QBfnGRpycUqkYw9egAQ73Joxk5b1xy4-J1rw_7X8?e=uAznsk&download=1";
export const ARKLOK_SHEET_NAME = "1-Fatura";

const COL = {
  patrimonio: "Patrimonio",
  serie: "N.Série",
  valor: "VALOR_UNIT",
  colaborador: "USUARIO",
  codigoCentro: "COD_CENTRO_CUSTO",
  centro: "SETOR",
  cidade: "CIDADE",
  codigoClasseValor: "COD_CLASSE VALOR",
} as const;

export async function carregarRateioArklok(): Promise<RateioPayload> {
  const buf = await baixarPlanilhaSharePoint(ARKLOK_PLANILHA_URL);
  const wb = XLSX.read(buf, { type: "array" });

  if (!wb.SheetNames.includes(ARKLOK_SHEET_NAME)) {
    throw new Error(
      `A aba oficial "${ARKLOK_SHEET_NAME}" não foi encontrada na planilha. Abas presentes: ${wb.SheetNames.join(", ")}.`,
    );
  }

  const ws = wb.Sheets[ARKLOK_SHEET_NAME];
  const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
  const colunas =
    linhas.length > 0
      ? Object.keys(linhas[0]).filter((column) => !column.startsWith("__EMPTY"))
      : [];

  const faltando = Object.values(COL).filter((column) => !colunas.includes(column));
  if (faltando.length > 0) {
    throw new Error(
      `Colunas obrigatórias ausentes na aba "${ARKLOK_SHEET_NAME}": ${faltando.join(", ")}. ` +
        `Colunas encontradas: ${colunas.join(", ")}.`,
    );
  }

  const map = new Map<string, CentroCusto>();
  let totalNotebooks = 0;

  for (const linha of linhas) {
    const nome = String(linha[COL.centro] ?? "").trim();
    if (!nome) continue;

    const codigo = String(linha[COL.codigoCentro] ?? "").trim();
    const id = `${codigo || "SEM-CODIGO"}::${nome}`;
    const notebook: Notebook = {
      colaborador: String(linha[COL.colaborador] ?? "").trim() || "—",
      serie: String(linha[COL.serie] ?? "").trim() || "—",
      cidade: String(linha[COL.cidade] ?? "").trim() || "—",
      valorMensal: toNumber(linha[COL.valor]),
      percentual: null,
      patrimonio: String(linha[COL.patrimonio] ?? "").trim() || undefined,
      codigoClasseValor: String(linha[COL.codigoClasseValor] ?? "").trim() || undefined,
    };

    if (!map.has(id)) {
      map.set(id, { id, codigo: codigo || "—", nome, notebooks: [] });
    }
    map.get(id)!.notebooks.push(notebook);
    totalNotebooks++;
  }

  const centros = Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));

  return {
    centros,
    lastSync: new Date().toISOString(),
    totalLinhas: linhas.length,
    totalCentros: centros.length,
    totalNotebooks,
    sheetName: ARKLOK_SHEET_NAME,
    colunasIdentificadas: colunas,
    arquivo: "RATEIO ARKLOK (SharePoint)",
  };
}
