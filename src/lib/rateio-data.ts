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

export interface LinhaPlanilha {
  N_Serie?: string | number;
  Valor_Unit?: string | number;
  Percentual?: string | number;
  Cod_Centro_Custo?: string | number;
  Centro_Custo?: string;
  Cidade?: string;
  Nome?: string;
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

export function montarCentrosDePlanilha(linhas: LinhaPlanilha[]): ImportResult {
  const map = new Map<string, CentroCusto>();
  let totalNotebooks = 0;

  for (const linha of linhas) {
    const codigo = String(linha.Cod_Centro_Custo ?? "").trim();
    if (!codigo) continue;
    const nome = String(linha.Centro_Custo ?? "").trim() || `Centro ${codigo}`;
    if (!map.has(codigo)) map.set(codigo, { codigo, nome, notebooks: [] });
    const cc = map.get(codigo)!;
    cc.notebooks.push({
      colaborador: String(linha.Nome ?? "").trim() || "—",
      serie: String(linha.N_Serie ?? "").trim() || "—",
      cidade: String(linha.Cidade ?? "").trim() || "—",
      valorMensal: toNumber(linha.Valor_Unit),
      percentual: toNumber(linha.Percentual),
    });
    totalNotebooks++;
  }

  const centros = Array.from(map.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
  return {
    centros,
    totalLinhas: linhas.length,
    totalCentros: centros.length,
    totalNotebooks,
  };
}
