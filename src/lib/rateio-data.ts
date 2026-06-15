import { useSyncExternalStore } from "react";
import { getRateioArklokData, getRateioData } from "./rateio.functions";
import type {
  CentroCusto,
  ContratoRateio,
  Notebook,
  RateioMeta,
  RateioResult,
  RateioState,
  RateioStatus,
} from "./rateio-types";

export type { CentroCusto, ContratoRateio, Notebook, RateioMeta, RateioState, RateioStatus };

type Loader = () => Promise<RateioResult>;

function createRateioStore(loader: Loader) {
  let state: RateioState = {
    status: "idle",
    centros: [],
    meta: null,
    error: null,
  };
  let loadingPromise: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function setState(next: Partial<RateioState>) {
    state = { ...state, ...next };
    emit();
  }

  async function refresh(): Promise<void> {
    if (loadingPromise) return loadingPromise;
    setState({ status: "loading", error: null });
    loadingPromise = (async () => {
      try {
        const result = await loader();
        if (result.ok) {
          const { centros, ...meta } = result.payload;
          setState({ status: "success", centros, meta, error: null });
        } else {
          setState({ status: "error", error: result.error, centros: [], meta: null });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setState({ status: "error", error: message, centros: [], meta: null });
      } finally {
        loadingPromise = null;
      }
    })();
    return loadingPromise;
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    if (state.status === "idle") void refresh();
    return () => listeners.delete(listener);
  }

  return {
    getSnapshot: () => state,
    subscribe,
    refresh,
  };
}

const stores = {
  soffner: createRateioStore(getRateioData),
  arklok: createRateioStore(getRateioArklokData),
} satisfies Record<ContratoRateio, ReturnType<typeof createRateioStore>>;

export function useContratoRateio(contrato: ContratoRateio): RateioState {
  const store = stores[contrato];
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

export function refreshContrato(contrato: ContratoRateio): Promise<void> {
  return stores[contrato].refresh();
}

export function useRateioData(): RateioState {
  return useContratoRateio("soffner");
}

export function refresh(): Promise<void> {
  return refreshContrato("soffner");
}

export function useCentros(): CentroCusto[] {
  return useRateioData().centros;
}

export function totalCC(cc: CentroCusto) {
  return cc.notebooks.reduce((sum, notebook) => sum + notebook.valorMensal, 0);
}

export function totalGeral(centros: CentroCusto[]) {
  return centros.reduce((sum, centro) => sum + totalCC(centro), 0);
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDataHora(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function getCentro(identifier: string, centros: CentroCusto[]) {
  return centros.find((centro) => centro.id === identifier || centro.codigo === identifier);
}
