import { useSyncExternalStore } from "react";
import { getRateioData } from "./rateio.functions";

// ---------- Tipos ----------

export interface Notebook {
  colaborador: string;
  serie: string;
  cidade: string;
  valorMensal: number;
  /** Percentual individual de rateio, em escala 0–100 (ex.: 20 = 20%). */
  percentual: number;
}

export interface CentroCusto {
  /** Identificador do centro (= próprio nome textual). */
  codigo: string;
  /** Nome do centro de custo (igual ao codigo). */
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

export type RateioStatus = "idle" | "loading" | "success" | "error";

export interface RateioState {
  status: RateioStatus;
  centros: CentroCusto[];
  meta: RateioMeta | null;
  error: string | null;
}

// ---------- Store reativa (única fonte: SharePoint, aba D21882) ----------

let state: RateioState = {
  status: "idle",
  centros: [],
  meta: null,
  error: null,
};
let loadingPromise: Promise<void> | null = null;

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function subscribe(l: () => void) {
  listeners.add(l);
  if (state.status === "idle") void refresh();
  return () => listeners.delete(l);
}
function setState(next: Partial<RateioState>) {
  state = { ...state, ...next };
  emit();
}

export async function refresh(): Promise<void> {
  if (loadingPromise) return loadingPromise;
  setState({ status: "loading", error: null });
  loadingPromise = (async () => {
    try {
      const res = await getRateioData();
      if (res.ok) {
        const { centros, ...meta } = res.payload;
        setState({ status: "success", centros, meta, error: null });
      } else {
        setState({ status: "error", error: res.error, centros: [], meta: null });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState({ status: "error", error: msg, centros: [], meta: null });
    } finally {
      loadingPromise = null;
    }
  })();
  return loadingPromise;
}

export function useRateioData(): RateioState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function useCentros(): CentroCusto[] {
  return useRateioData().centros;
}

// ---------- Helpers de exibição ----------

export function totalCC(cc: CentroCusto) {
  return cc.notebooks.reduce((s, n) => s + n.valorMensal, 0);
}
export function totalGeral(centros: CentroCusto[]) {
  return centros.reduce((s, cc) => s + totalCC(cc), 0);
}
export function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
export function formatDataHora(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}
export function getCentro(codigo: string, centros: CentroCusto[]) {
  return centros.find((c) => c.codigo === codigo);
}
