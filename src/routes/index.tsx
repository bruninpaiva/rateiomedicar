import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { ImportarPlanilha } from "@/components/ImportarPlanilha";
import { useCentros, totalCC, percentualCC, formatBRL } from "@/lib/rateio-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Central de Rateio de Equipamentos" },
      { name: "description", content: "Portal interno para consulta de notebooks vinculados aos centros de custo." },
    ],
  }),
  component: Index,
});

function Index() {
  const centrosCusto = useCentros();
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return centrosCusto;
    return centrosCusto.filter(
      (c) => c.nome.toLowerCase().includes(q) || c.codigo.includes(q),
    );
  }, [busca, centrosCusto]);

  const totalNotebooks = centrosCusto.reduce((s, c) => s + c.notebooks.length, 0);
  const totalValor = centrosCusto.reduce((s, c) => s + totalCC(c), 0);

  return (
    <PortalLayout>
      <section className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1d3557]">Consulta de Centros de Custo</h1>
        <p className="text-sm text-[#5b6573] mt-1 max-w-3xl">
          Utilize esta página para localizar os centros de custo sob sua responsabilidade
          e verificar os notebooks rateados antes de efetuar a aprovação no TOTVS.
          Esta tela é exclusivamente de consulta.
        </p>
      </section>

      <ImportarPlanilha />

      <section>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:justify-between mb-5">
          <div className="flex items-center gap-4 text-xs text-[#5b6573]">
            <span><strong className="text-[#1f2937]">{centrosCusto.length}</strong> centros</span>
            <span className="text-[#dfe3e8]">|</span>
            <span><strong className="text-[#1f2937]">{totalNotebooks}</strong> notebooks</span>
            <span className="text-[#dfe3e8]">|</span>
            <span>Total mensal <strong className="text-[#1f2937]">{formatBRL(totalValor)}</strong></span>
          </div>
          <div className="sm:w-80">
            <label className="block text-[11px] uppercase tracking-wider text-[#5b6573] mb-1">
              Buscar centro de custo
            </label>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome ou código"
              className="w-full border border-[#c9d0d8] bg-white px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1d3557] focus:ring-1 focus:ring-[#1d3557]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtrados.map((cc) => (
            <Link
              key={cc.codigo}
              to="/centro/$codigo"
              params={{ codigo: cc.codigo }}
              className="group block bg-white border border-[#dfe3e8] rounded-sm p-5 hover:border-[#1d3557] hover:shadow-[0_4px_12px_rgba(29,53,87,0.08)] transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-[11px] font-mono text-[#5b6573] mb-1">{cc.codigo}</div>
                  <h3 className="text-[15px] font-semibold text-[#1d3557] leading-snug group-hover:text-[#1d3557]">
                    {cc.nome}
                  </h3>
                </div>
                <span className="text-[#1d3557] text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#eef0f3]">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#5b6573] mb-0.5">Notebooks</div>
                  <div className="text-lg font-semibold text-[#1f2937] tabular-nums">{cc.notebooks.length}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#5b6573] mb-0.5">Mensal</div>
                  <div className="text-sm font-semibold text-[#1f2937] tabular-nums">{formatBRL(totalCC(cc))}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#5b6573] mb-0.5">% Total</div>
                  <div className="text-sm font-semibold text-[#1f2937] tabular-nums">{percentualCC(cc).toFixed(2)}%</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtrados.length === 0 && (
          <div className="py-12 text-center text-sm text-[#5b6573] bg-white border border-[#dfe3e8] rounded-sm">
            Nenhum centro de custo encontrado.
          </div>
        )}
      </section>
    </PortalLayout>
  );
}
