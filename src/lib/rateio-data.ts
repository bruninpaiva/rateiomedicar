import { useSyncExternalStore } from "react";
import { getRateioData } from "./rateio.functions";

// ---------- Tipos ----------

export interface Notebook {
  colaborador: string;
  serie: string;
  cidade: string;
  valorMensal: number;
  percentual: number;
}

export interface CentroCusto {
  codigo: string;
  nome: string;
  notebooks: Notebook[];
}

export type CampoMapeavel =
  | "codigo"
  | "centro"
  | "serie"
  | "nome"
  | "cidade"
  | "valor"
  | "percentual";

export interface MapeamentoColunas {
  codigo: string | null;
  centro: string | null;
  serie: string | null;
  nome: string | null;
  cidade: string | null;
  valor: string | null;
  percentual: string | null;
}

export interface RateioMeta {
  lastSync: string;
  totalLinhas: number;
  totalCentros: number;
  totalNotebooks: number;
  sheetName: string;
  colunasIdentificadas: string[];
  mapeamento: MapeamentoColunas;
  arquivo: string;
}

export type RateioStatus = "idle" | "loading" | "success" | "error";

export interface RateioState {
  status: RateioStatus;
  centros: CentroCusto[];
  meta: RateioMeta | null;
  error: string | null;
}

// ---------- Helpers de parsing (isomorphic) ----------

const ALIASES: Record<CampoMapeavel, string[]> = {
  codigo: ["cod_centro_custo", "codigo_centro_custo", "cod_cc", "codigo", "cod", "cc"],
  centro: ["centro_custo", "centrodecusto", "centro", "departamento", "setor", "nome_cc"],
  serie: ["n_serie", "numero_serie", "numerodeserie", "serie", "serial", "n_de_serie", "nserie"],
  nome: ["nome", "colaborador", "funcionario", "usuario", "responsavel"],
  cidade: ["cidade", "city", "localidade", "municipio"],
  valor: ["valor_unit", "valor_unitario", "valor", "valor_mensal", "preco", "valor_total"],
  percentual: ["percentual", "percent", "porcentagem", "rateio", "perc"],
};

function normalizar(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function autoDetectarMapeamento(colunas: string[]): MapeamentoColunas {
  const result: MapeamentoColunas = {
    codigo: null, centro: null, serie: null, nome: null,
    cidade: null, valor: null, percentual: null,
  };
  const normMap = new Map(colunas.map((c) => [normalizar(c), c]));
  (Object.keys(ALIASES) as CampoMapeavel[]).forEach((campo) => {
    for (const alias of ALIASES[campo]) {
      if (normMap.has(alias)) {
        result[campo] = normMap.get(alias)!;
        return;
      }
    }
    for (const [norm, original] of normMap.entries()) {
      if (ALIASES[campo].some((a) => norm.includes(a) || a.includes(norm))) {
        result[campo] = original;
        return;
      }
    }
  });
  return result;
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

export interface ImportResult {
  centros: CentroCusto[];
  totalLinhas: number;
  totalCentros: number;
  totalNotebooks: number;
}

export function montarCentrosComMapeamento(
  linhas: Record<string, unknown>[],
  m: MapeamentoColunas,
): ImportResult {
  const map = new Map<string, CentroCusto>();
  let totalNotebooks = 0;

  for (const linha of linhas) {
    const nomeCentro = m.centro ? String(linha[m.centro] ?? "").trim() : "";
    const codigoRaw = m.codigo ? String(linha[m.codigo] ?? "").trim() : "";
    const codigo = codigoRaw || nomeCentro;
    if (!codigo) continue;
    const nome = nomeCentro || codigoRaw || codigo;
    if (!map.has(codigo)) map.set(codigo, { codigo, nome, notebooks: [] });
    const cc = map.get(codigo)!;
    cc.notebooks.push({
      colaborador: m.nome ? String(linha[m.nome] ?? "").trim() || "—" : "—",
      serie: m.serie ? String(linha[m.serie] ?? "").trim() || "—" : "—",
      cidade: m.cidade ? String(linha[m.cidade] ?? "").trim() || "—" : "—",
      valorMensal: m.valor ? toNumber(linha[m.valor]) : 0,
      percentual: m.percentual ? toNumber(linha[m.percentual]) : 0,
    });
    totalNotebooks++;
  }

  // Se o percentual está em formato decimal (0–1), converte para porcentagem (0–100)
  if (m.percentual) {
    const todos = Array.from(map.values()).flatMap((cc) => cc.notebooks);
    const max = todos.reduce((mx, n) => Math.max(mx, n.percentual), 0);
    if (max > 0 && max <= 1.5) {
      todos.forEach((n) => (n.percentual = n.percentual * 100));
    }
  } else {
    // Sem coluna de percentual: recalcula a partir do valor dentro do centro
    for (const cc of map.values()) {
      const total = cc.notebooks.reduce((s, n) => s + n.valorMensal, 0);
      cc.notebooks.forEach((n) => (n.percentual = total > 0 ? (n.valorMensal / total) * 100 : 0));
    }
  }

  const centros = Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  return {
    centros,
    totalLinhas: linhas.length,
    totalCentros: centros.length,
    totalNotebooks,
  };
}

// ---------- Store reativa (alimentada APENAS pelo SharePoint) ----------

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
export function percentualCC(cc: CentroCusto, centros: CentroCusto[]) {
  const g = totalGeral(centros);
  return g === 0 ? 0 : (totalCC(cc) / g) * 100;
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
