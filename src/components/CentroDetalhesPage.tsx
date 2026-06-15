import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import {
  formatBRL,
  getCentro,
  totalCC,
  useContratoRateio,
  type ContratoRateio,
} from "@/lib/rateio-data";

export function CentroDetalhesPage({
  contrato,
  codigo,
}: {
  contrato: ContratoRateio;
  codigo: string;
}) {
  const { centros, status } = useContratoRateio(contrato);
  const centro = getCentro(codigo, centros);
  const [cidade, setCidade] = useState("");
  const [colaborador, setColaborador] = useState("");
  const [busca, setBusca] = useState("");
  const contratoNome = contrato.toUpperCase();
  const rotaContrato = contrato === "soffner" ? "/rateio/soffner" : "/rateio/arklok";

  const cidades = useMemo(
    () => Array.from(new Set(centro?.notebooks.map((notebook) => notebook.cidade) ?? [])).sort(),
    [centro],
  );

  const lista = useMemo(() => {
    if (!centro) return [];
    const query = busca.trim().toLowerCase();
    return centro.notebooks.filter((notebook) => {
      if (cidade && notebook.cidade !== cidade) return false;
      if (colaborador && !notebook.colaborador.toLowerCase().includes(colaborador.toLowerCase())) {
        return false;
      }
      if (
        query &&
        ![
          notebook.colaborador,
          notebook.serie,
          notebook.cidade,
          notebook.patrimonio,
          notebook.codigoClasseValor,
        ].some((value) => value?.toLowerCase().includes(query))
      ) {
        return false;
      }
      return true;
    });
  }, [centro, cidade, colaborador, busca]);

  if (!centro) {
    return (
      <PortalLayout>
        <div className="border border-[#dfe3e8] bg-white p-8 text-center">
          <p className="text-sm text-[#5b6573]">
            {status === "loading"
              ? "Carregando centro de custo…"
              : "Centro de custo não encontrado."}
          </p>
          <Link to={rotaContrato} className="text-sm text-[#1d3557] hover:underline">
            ← Voltar
          </Link>
        </div>
      </PortalLayout>
    );
  }

  const exibirCamposArklok = contrato === "arklok";

  return (
    <PortalLayout
      breadcrumb={
        <>
          <Link to="/" className="hover:underline">
            Portal de Rateios
          </Link>
          <span className="mx-1 text-[#c9d0d8]">/</span>
          <Link to={rotaContrato} className="hover:underline">
            {contratoNome}
          </Link>
          <span className="mx-1 text-[#c9d0d8]">/</span>
          <span className="text-[#1f2937]">Centro {centro.codigo}</span>
        </>
      }
    >
      <div className="mb-5 flex flex-col gap-3 print:mb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#5b6573]">
            Centro de Custo {centro.codigo}
          </div>
          <h1 className="text-2xl font-semibold text-[#1d3557]">{centro.nome}</h1>
        </div>
        <div className="flex gap-2 print:hidden">
          <Link
            to={rotaContrato}
            className="rounded-sm border border-[#c9d0d8] bg-white px-3 py-2 text-sm text-[#1f2937] hover:bg-[#f4f5f7]"
          >
            ← Voltar
          </Link>
          <button
            onClick={() => window.print()}
            className="rounded-sm bg-[#1d3557] px-3 py-2 text-sm text-white hover:bg-[#15294a]"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      <section className="mb-6 grid grid-cols-2 border border-[#dfe3e8] bg-white sm:grid-cols-3">
        <Resumo label="Notebooks" valor={String(centro.notebooks.length)} />
        <Resumo label="Valor Mensal Total" valor={formatBRL(totalCC(centro))} />
        <Resumo label="Centro de Custo" valor={centro.nome} />
      </section>

      <section className="rounded-sm border border-[#dfe3e8] bg-white">
        <div className="grid grid-cols-1 gap-3 border-b border-[#dfe3e8] bg-[#fafbfc] px-5 py-4 print:hidden sm:grid-cols-3">
          <CampoFiltro label="Busca rápida">
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Colaborador, série ou cidade"
              className="w-full rounded-sm border border-[#c9d0d8] bg-white px-3 py-2 text-sm focus:border-[#1d3557] focus:outline-none"
            />
          </CampoFiltro>
          <CampoFiltro label="Cidade">
            <select
              value={cidade}
              onChange={(event) => setCidade(event.target.value)}
              className="w-full rounded-sm border border-[#c9d0d8] bg-white px-3 py-2 text-sm focus:border-[#1d3557] focus:outline-none"
            >
              <option value="">Todas</option>
              {cidades.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </CampoFiltro>
          <CampoFiltro label="Colaborador">
            <input
              value={colaborador}
              onChange={(event) => setColaborador(event.target.value)}
              placeholder="Filtrar por nome"
              className="w-full rounded-sm border border-[#c9d0d8] bg-white px-3 py-2 text-sm focus:border-[#1d3557] focus:outline-none"
            />
          </CampoFiltro>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#dfe3e8] bg-[#fafbfc] text-left text-[11px] uppercase tracking-wider text-[#5b6573]">
                <th className="px-5 py-2 font-medium">Colaborador</th>
                <th className="px-5 py-2 font-medium">Número de Série</th>
                {exibirCamposArklok && <th className="px-5 py-2 font-medium">Patrimônio</th>}
                <th className="px-5 py-2 font-medium">Cidade</th>
                {exibirCamposArklok && <th className="px-5 py-2 font-medium">Classe de Valor</th>}
                <th className="px-5 py-2 text-right font-medium">Valor Mensal</th>
                <th className="px-5 py-2 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((notebook) => (
                <tr key={notebook.serie} className="border-b border-[#eef0f3] hover:bg-[#f7f9fb]">
                  <td className="px-5 py-3">{notebook.colaborador}</td>
                  <td className="px-5 py-3 font-mono text-[#5b6573]">{notebook.serie}</td>
                  {exibirCamposArklok && (
                    <td className="px-5 py-3 font-mono text-[#5b6573]">
                      {notebook.patrimonio ?? "—"}
                    </td>
                  )}
                  <td className="px-5 py-3">{notebook.cidade}</td>
                  {exibirCamposArklok && (
                    <td className="px-5 py-3 font-mono text-[#5b6573]">
                      {notebook.codigoClasseValor ?? "—"}
                    </td>
                  )}
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatBRL(notebook.valorMensal)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {notebook.percentual == null ? "—" : `${notebook.percentual.toFixed(2)}%`}
                  </td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr>
                  <td
                    colSpan={exibirCamposArklok ? 7 : 5}
                    className="px-5 py-8 text-center text-sm text-[#5b6573]"
                  >
                    Nenhum notebook encontrado com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
            {lista.length > 0 && (
              <tfoot>
                <tr className="border-t border-[#dfe3e8] bg-[#fafbfc] text-sm font-medium">
                  <td className="px-5 py-3" colSpan={exibirCamposArklok ? 5 : 3}>
                    Total exibido
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatBRL(lista.reduce((sum, notebook) => sum + notebook.valorMensal, 0))}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-[#5b6573]">—</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </PortalLayout>
  );
}

function CampoFiltro({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] uppercase tracking-wider text-[#5b6573]">
        {label}
      </label>
      {children}
    </div>
  );
}

function Resumo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="border-r border-[#dfe3e8] px-5 py-4 last:border-r-0">
      <div className="text-[11px] uppercase tracking-wider text-[#5b6573]">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[#1f2937]">{valor}</div>
    </div>
  );
}
