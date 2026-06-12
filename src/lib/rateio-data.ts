import { useSyncExternalStore } from "react";

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

// ---------- Seed (dados fictícios para demonstração) ----------

const cidades = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre", "Recife", "Salvador", "Brasília"];
const nomes = [
  "Ana Carolina Silva", "Bruno Almeida Costa", "Carla Mendes Ferreira", "Daniel Rocha Lima",
  "Eduarda Pereira Souza", "Fernando Oliveira Dias", "Gabriela Martins Pinto", "Henrique Barbosa Cruz",
  "Isabela Cardoso Nunes", "João Pedro Ribeiro", "Karina Azevedo Melo", "Lucas Vieira Campos",
  "Mariana Teixeira Reis", "Nathan Cordeiro Pires", "Olivia Ramos Freitas", "Paulo Henrique Moraes",
  "Quésia Sant'Anna", "Rafael Monteiro Castro", "Sabrina Lopes Andrade", "Thiago Nogueira Pinto",
  "Ursula Bittencourt", "Vinícius Carvalho Brito", "Wesley Tavares Galvão", "Xavier Quintana",
  "Yasmin Duarte Fonseca", "Zeca Pagodinho Júnior", "Amanda Borges Siqueira", "Beatriz Antunes",
  "Caio Fernandes Macedo", "Diana Prado Vasconcelos",
];

const centrosBase = [
  { codigo: "1010", nome: "Diretoria Executiva" },
  { codigo: "2020", nome: "Tecnologia da Informação" },
  { codigo: "3030", nome: "Recursos Humanos" },
  { codigo: "4040", nome: "Financeiro e Contábil" },
  { codigo: "5050", nome: "Comercial - Vendas" },
  { codigo: "6060", nome: "Marketing e Comunicação" },
  { codigo: "7070", nome: "Operações e Logística" },
  { codigo: "8080", nome: "Jurídico e Compliance" },
  { codigo: "9090", nome: "Pesquisa e Desenvolvimento" },
  { codigo: "1111", nome: "Suporte ao Cliente" },
];

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

function gerarSeed(): CentroCusto[] {
  let nomeIdx = 0;
  let serieIdx = 0;
  return centrosBase.map((cc, idx) => {
    const qtd = 3 + ((idx * 7) % 6);
    const notebooks: Notebook[] = [];
    for (let i = 0; i < qtd; i++) {
      const valor = 180 + ((idx * 13 + i * 29) % 220);
      notebooks.push({
        colaborador: pick(nomes, nomeIdx++),
        serie: `NB-${String(2024000 + serieIdx++).padStart(7, "0")}`,
        cidade: pick(cidades, idx + i),
        valorMensal: valor,
        percentual: 0,
      });
    }
    const total = notebooks.reduce((s, n) => s + n.valorMensal, 0);
    notebooks.forEach((n) => (n.percentual = (n.valorMensal / total) * 100));
    return { ...cc, notebooks };
  });
}

// ---------- Store reativo (com persistência local) ----------

const STORAGE_KEY = "rateio:centros";

function loadInitial(): CentroCusto[] {
  if (typeof window === "undefined") return gerarSeed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CentroCusto[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return gerarSeed();
}

let centrosState: CentroCusto[] = loadInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function setCentros(next: CentroCusto[]) {
  centrosState = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  emit();
}

export function resetCentros() {
  setCentros(gerarSeed());
}

export function getCentrosSnapshot() {
  return centrosState;
}

export function useCentros(): CentroCusto[] {
  return useSyncExternalStore(subscribe, getCentrosSnapshot, getCentrosSnapshot);
}

// ---------- Helpers ----------

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

export function getCentro(codigo: string, centros: CentroCusto[]) {
  return centros.find((c) => c.codigo === codigo);
}

// ---------- Importação de planilha ----------

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

export const CAMPOS_MAPEAVEIS: { campo: CampoMapeavel; rotulo: string; obrigatorio: boolean }[] = [
  { campo: "centro", rotulo: "Centro de Custo (nome)", obrigatorio: true },
  { campo: "codigo", rotulo: "Código do Centro de Custo", obrigatorio: false },
  { campo: "serie", rotulo: "Número de Série", obrigatorio: true },
  { campo: "nome", rotulo: "Nome do Colaborador", obrigatorio: true },
  { campo: "cidade", rotulo: "Cidade", obrigatorio: false },
  { campo: "valor", rotulo: "Valor", obrigatorio: true },
  { campo: "percentual", rotulo: "Percentual", obrigatorio: false },
];

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
    // fallback: contém
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
    const nome = nomeCentro || `Centro ${codigo}`;
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

  // Recalcula percentual se a coluna não foi mapeada
  if (!m.percentual) {
    for (const cc of map.values()) {
      const total = cc.notebooks.reduce((s, n) => s + n.valorMensal, 0);
      cc.notebooks.forEach((n) => (n.percentual = total > 0 ? (n.valorMensal / total) * 100 : 0));
    }
  }

  const centros = Array.from(map.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
  return {
    centros,
    totalLinhas: linhas.length,
    totalCentros: centros.length,
    totalNotebooks,
  };
}

