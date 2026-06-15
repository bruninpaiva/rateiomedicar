export type ContratoRateio = "soffner" | "arklok";

export interface Notebook {
  colaborador: string;
  serie: string;
  cidade: string;
  valorMensal: number;
  percentual: number | null;
  patrimonio?: string;
  codigoClasseValor?: string;
}

export interface CentroCusto {
  id: string;
  codigo: string;
  nome: string;
  notebooks: Notebook[];
}

export interface RateioMeta {
  lastSync: string;
  totalLinhas: number;
  totalCentros: number;
  totalNotebooks: number;
  sheetName: string;
  colunasIdentificadas: string[];
  arquivo: string;
}

export interface RateioPayload extends RateioMeta {
  centros: CentroCusto[];
}

export type RateioStatus = "idle" | "loading" | "success" | "error";

export interface RateioState {
  status: RateioStatus;
  centros: CentroCusto[];
  meta: RateioMeta | null;
  error: string | null;
}

export type RateioResult = { ok: true; payload: RateioPayload } | { ok: false; error: string };
