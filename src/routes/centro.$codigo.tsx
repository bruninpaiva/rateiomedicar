import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { useCentros, getCentro, totalCC, percentualCC, formatBRL } from "@/lib/rateio-data";

export const Route = createFileRoute("/centro/$codigo")({
  head: ({ params }) => ({
    meta: [{ title: `Centro ${params.codigo} · Central de Rateio` }],
  }),
  component: Detalhes,
  notFoundComponent: () => (
    <PortalLayout>
      <div className="bg-white border border-[#dfe3e8] p-8 text-center">
        <p className="text-sm text-[#5b6573]">Centro de custo não encontrado.</p>
        <Link to="/" className="text-[#1d3557] hover:underline text-sm">← Voltar</Link>
      </div>
    </PortalLayout>
  ),
});

function Detalhes() {
  const { codigo } = Route.useParams();
  const centros = useCentros();
  const cc = getCentro(codigo, centros);
  if (!cc) {
    return (
      <PortalLayout>
        <div className="bg-white border border-[#dfe3e8] p-8 text-center">
          <p className="text-sm text-[#5b6573]">Centro de custo não encontrado.</p>
          <Link to="/" className="text-[#1d3557] hover:underline text-sm">← Voltar</Link>
        </div>
      </PortalLayout>
    );
  }
  const [cidade, setCidade] = useState("");
  const [colaborador, setColaborador] = useState("");
  const [busca, setBusca] = useState("");

  const cidades = useMemo(
    () => Array.from(new Set(cc.notebooks.map((n) => n.cidade))).sort(),
    [cc],
  );

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return cc.notebooks.filter((n) => {
      if (cidade && n.cidade !== cidade) return false;
      if (colaborador && !n.colaborador.toLowerCase().includes(colaborador.toLowerCase())) return false;
      if (q && !(
        n.colaborador.toLowerCase().includes(q) ||
        n.serie.toLowerCase().includes(q) ||
        n.cidade.toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [cc, cidade, colaborador, busca]);

  function exportarPDF() {
    window.print();
  }

  return (
    <PortalLayout
      breadcrumb={
        <>
          <Link to="/" className="hover:underline">Início</Link>
          <span className="mx-1 text-[#c9d0d8]">/</span>
          <span className="text-[#1f2937]">Centro {cc.codigo}</span>
        </>
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 print:mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#5b6573]">Centro de Custo {cc.codigo}</div>
          <h1 className="text-2xl font-semibold text-[#1d3557]">{cc.nome}</h1>
        </div>
        <div className="flex gap-2 print:hidden">
          <Link
            to="/"
            className="px-3 py-2 text-sm border border-[#c9d0d8] bg-white text-[#1f2937] hover:bg-[#f4f5f7] rounded-sm"
          >
            ← Voltar
          </Link>
          <button
            onClick={exportarPDF}
            className="px-3 py-2 text-sm bg-[#1d3557] text-white hover:bg-[#15294a] rounded-sm"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 sm:grid-cols-4 border border-[#dfe3e8] bg-white mb-6">
        <Resumo label="Notebooks" valor={String(cc.notebooks.length)} />
        <Resumo label="Valor Mensal" valor={formatBRL(totalCC(cc))} />
        <Resumo label="% do Total" valor={`${percentualCC(cc).toFixed(2)}%`} />
        <Resumo label="Código" valor={cc.codigo} mono />
      </section>

      <section className="bg-white border border-[#dfe3e8] rounded-sm">
        <div className="px-5 py-4 border-b border-[#dfe3e8] bg-[#fafbfc] grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#5b6573] mb-1">Busca rápida</label>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Colaborador, série ou cidade"
              className="w-full border border-[#c9d0d8] bg-white px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1d3557]"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#5b6573] mb-1">Cidade</label>
            <select
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="w-full border border-[#c9d0d8] bg-white px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1d3557]"
            >
              <option value="">Todas</option>
              {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#5b6573] mb-1">Colaborador</label>
            <input
              value={colaborador}
              onChange={(e) => setColaborador(e.target.value)}
              placeholder="Filtrar por nome"
              className="w-full border border-[#c9d0d8] bg-white px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1d3557]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[#5b6573] bg-[#fafbfc] border-b border-[#dfe3e8]">
                <th className="px-5 py-2 font-medium">Colaborador</th>
                <th className="px-5 py-2 font-medium">Número de Série</th>
                <th className="px-5 py-2 font-medium">Cidade</th>
                <th className="px-5 py-2 font-medium text-right">Valor Mensal</th>
                <th className="px-5 py-2 font-medium text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((n) => (
                <tr key={n.serie} className="border-b border-[#eef0f3] hover:bg-[#f7f9fb]">
                  <td className="px-5 py-3">{n.colaborador}</td>
                  <td className="px-5 py-3 font-mono text-[#5b6573]">{n.serie}</td>
                  <td className="px-5 py-3">{n.cidade}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatBRL(n.valorMensal)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{n.percentual.toFixed(2)}%</td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-[#5b6573]">
                    Nenhum notebook encontrado com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
            {lista.length > 0 && (
              <tfoot>
                <tr className="bg-[#fafbfc] border-t border-[#dfe3e8] text-sm font-medium">
                  <td className="px-5 py-3" colSpan={3}>Total exibido</td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatBRL(lista.reduce((s, n) => s + n.valorMensal, 0))}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {lista.reduce((s, n) => s + n.percentual, 0).toFixed(2)}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </PortalLayout>
  );
}

function Resumo({ label, valor, mono }: { label: string; valor: string; mono?: boolean }) {
  return (
    <div className="px-5 py-4 border-r last:border-r-0 border-[#dfe3e8]">
      <div className="text-[11px] uppercase tracking-wider text-[#5b6573]">{label}</div>
      <div className={`mt-1 text-lg text-[#1f2937] ${mono ? "font-mono" : "font-semibold"}`}>{valor}</div>
    </div>
  );
}
