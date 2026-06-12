import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { centrosCusto, totalCC, percentualCC, formatBRL } from "@/lib/rateio-data";

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
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return centrosCusto;
    return centrosCusto.filter(
      (c) => c.nome.toLowerCase().includes(q) || c.codigo.includes(q),
    );
  }, [busca]);

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

      <section className="bg-white border border-[#dfe3e8] rounded-sm">
        <div className="px-5 py-4 border-b border-[#dfe3e8] bg-[#fafbfc] flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[#5b6573] bg-[#fafbfc] border-b border-[#dfe3e8]">
                <th className="px-5 py-2 font-medium">Código</th>
                <th className="px-5 py-2 font-medium">Centro de Custo</th>
                <th className="px-5 py-2 font-medium text-right">Notebooks</th>
                <th className="px-5 py-2 font-medium text-right">Valor Mensal</th>
                <th className="px-5 py-2 font-medium text-right">% Total</th>
                <th className="px-5 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((cc) => (
                <tr key={cc.codigo} className="border-b border-[#eef0f3] hover:bg-[#f7f9fb]">
                  <td className="px-5 py-3 font-mono text-[#5b6573]">{cc.codigo}</td>
                  <td className="px-5 py-3 font-medium text-[#1f2937]">{cc.nome}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{cc.notebooks.length}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatBRL(totalCC(cc))}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{percentualCC(cc).toFixed(2)}%</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to="/centro/$codigo"
                      params={{ codigo: cc.codigo }}
                      className="text-[#1d3557] hover:underline text-xs font-medium"
                    >
                      Detalhes →
                    </Link>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-[#5b6573]">
                    Nenhum centro de custo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PortalLayout>
  );
}
