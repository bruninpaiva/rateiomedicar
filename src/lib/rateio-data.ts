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

function gerarSerie(i: number) {
  return `NB-${String(2024000 + i).padStart(7, "0")}`;
}

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

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

let nomeIdx = 0;
let serieIdx = 0;

export const centrosCusto: CentroCusto[] = centrosBase.map((cc, idx) => {
  const qtd = 3 + ((idx * 7) % 6); // 3 a 8 notebooks
  const notebooks: Notebook[] = [];
  for (let i = 0; i < qtd; i++) {
    const valor = 180 + ((idx * 13 + i * 29) % 220); // R$180 a R$399
    notebooks.push({
      colaborador: pick(nomes, nomeIdx++),
      serie: gerarSerie(serieIdx++),
      cidade: pick(cidades, idx + i),
      valorMensal: valor,
      percentual: 0, // calculado abaixo
    });
  }
  const total = notebooks.reduce((s, n) => s + n.valorMensal, 0);
  notebooks.forEach((n) => (n.percentual = (n.valorMensal / total) * 100));
  return { ...cc, notebooks };
});

export function totalCC(cc: CentroCusto) {
  return cc.notebooks.reduce((s, n) => s + n.valorMensal, 0);
}

const totalGeral = centrosCusto.reduce((s, cc) => s + totalCC(cc), 0);

export function percentualCC(cc: CentroCusto) {
  return (totalCC(cc) / totalGeral) * 100;
}

export function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function getCentro(codigo: string) {
  return centrosCusto.find((c) => c.codigo === codigo);
}
