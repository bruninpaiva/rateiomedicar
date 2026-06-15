import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import {
  formatBRL,
  formatDataHora,
  refreshContrato,
  totalCC,
  useContratoRateio,
  type ContratoRateio,
  type RateioState,
} from "@/lib/rateio-data";

const config = {
  soffner: {
    nome: "SOFFNER",
    descricao:
      "Utilize esta página para localizar os centros de custo sob sua responsabilidade e verificar os notebooks rateados antes de efetuar a aprovação no TOTVS. Esta tela é exclusivamente de consulta.",
  },
  arklok: {
    nome: "ARKLOK",
    descricao:
      "Utilize esta página para localizar os centros de custo e consultar os notebooks vinculados ao contrato ARKLOK.",
  },
} satisfies Record<ContratoRateio, { nome: string; descricao: string }>;

export function RateioContratoPage({ contrato }: { contrato: ContratoRateio }) {
  const { status, centros, meta, error } = useContratoRateio(contrato);
  const [busca, setBusca] = useState("");
  const contratoConfig = config[contrato];

  const filtrados = useMemo(() => {
    const query = busca.trim().toLowerCase();
    if (!query) return centros;
    return centros.filter(
      (centro) =>
        centro.nome.toLowerCase().includes(query) || centro.codigo.toLowerCase().includes(query),
    );
  }, [busca, centros]);

  const totalNotebooks = centros.reduce((sum, centro) => sum + centro.notebooks.length, 0);
  const totalValor = centros.reduce((sum, centro) => sum + totalCC(centro), 0);

  return (
    <PortalLayout
      breadcrumb={
        <span>
          <Link to="/" className="hover:underline">
            Portal de Rateios
          </Link>
          <span className="mx-2 text-[#c9d0d8]">/</span>
          <span>{contratoConfig.nome}</span>
        </span>
      }
    >
      <section className="mb-6">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wider text-[#5b6573]">
              Contrato {contratoConfig.nome}
            </div>
            <h1 className="text-2xl font-semibold text-[#1d3557]">Consulta de Centros de Custo</h1>
          </div>
          <Link
            to="/"
            className="rounded-sm border border-[#c9d0d8] bg-white px-3 py-2 text-sm text-[#1f2937] hover:bg-[#f4f5f7]"
          >
            ← Portal de Rateios
          </Link>
        </div>
        <p className="mt-1 max-w-3xl text-sm text-[#5b6573]">{contratoConfig.descricao}</p>
      </section>

      <BannerSincronizacao contrato={contrato} status={status} meta={meta} error={error} />

      {status === "error" ? null : (
        <section>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-4 text-xs text-[#5b6573]">
              <span>
                <strong className="text-[#1f2937]">{centros.length}</strong> centros
              </span>
              <span className="text-[#dfe3e8]">|</span>
              <span>
                <strong className="text-[#1f2937]">{totalNotebooks}</strong> notebooks
              </span>
              <span className="text-[#dfe3e8]">|</span>
              <span>
                Total mensal <strong className="text-[#1f2937]">{formatBRL(totalValor)}</strong>
              </span>
            </div>
            <div className="sm:w-80">
              <label className="mb-1 block text-[11px] uppercase tracking-wider text-[#5b6573]">
                Buscar centro de custo
              </label>
              <input
                type="text"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Nome ou código"
                className="w-full rounded-sm border border-[#c9d0d8] bg-white px-3 py-2 text-sm focus:border-[#1d3557] focus:outline-none focus:ring-1 focus:ring-[#1d3557]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((centro) => (
              <Link
                key={centro.id}
                to="/rateio/$contrato/centro/$codigo"
                params={{ contrato, codigo: centro.id }}
                className="group block rounded-sm border border-[#dfe3e8] bg-white p-5 transition-all duration-200 hover:border-[#1d3557] hover:shadow-[0_4px_12px_rgba(29,53,87,0.08)]"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="mb-1 text-[11px] uppercase tracking-wider text-[#5b6573]">
                      Centro de Custo
                    </div>
                    <h3 className="text-[15px] font-semibold leading-snug text-[#1d3557]">
                      {centro.nome}
                    </h3>
                    {contrato === "arklok" && (
                      <div className="mt-1 text-xs text-[#5b6573]">Código {centro.codigo}</div>
                    )}
                  </div>
                  <span className="text-lg text-[#1d3557] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    →
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-[#eef0f3] pt-4">
                  <div>
                    <div className="mb-0.5 text-[11px] uppercase tracking-wider text-[#5b6573]">
                      Notebooks
                    </div>
                    <div className="text-lg font-semibold tabular-nums text-[#1f2937]">
                      {centro.notebooks.length}
                    </div>
                  </div>
                  <div>
                    <div className="mb-0.5 text-[11px] uppercase tracking-wider text-[#5b6573]">
                      Valor Mensal
                    </div>
                    <div className="text-sm font-semibold tabular-nums text-[#1f2937]">
                      {formatBRL(totalCC(centro))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {status === "success" && filtrados.length === 0 && (
            <div className="rounded-sm border border-[#dfe3e8] bg-white py-12 text-center text-sm text-[#5b6573]">
              Nenhum centro de custo encontrado.
            </div>
          )}
        </section>
      )}
    </PortalLayout>
  );
}

function BannerSincronizacao({
  contrato,
  status,
  meta,
  error,
}: Pick<RateioState, "status" | "meta" | "error"> & { contrato: ContratoRateio }) {
  if (status === "loading" && !meta) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-sm border border-[#dfe3e8] bg-white px-4 py-3 text-sm text-[#5b6573]">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#1d3557]" />
        Sincronizando dados com a planilha do SharePoint…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mb-6 rounded-sm border border-[#f1c9c9] bg-[#fdf3f3] px-4 py-4">
        <div className="mb-1 text-sm font-semibold text-[#8a2a2a]">
          Não foi possível carregar os dados da planilha
        </div>
        <p className="text-xs leading-relaxed text-[#8a2a2a]">{error}</p>
        <button
          onClick={() => refreshContrato(contrato)}
          className="mt-3 rounded-sm bg-[#8a2a2a] px-3 py-1.5 text-xs text-white hover:bg-[#6e2020]"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (status === "success" && meta) {
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-sm border border-[#dfe3e8] bg-[#f4f7fa] px-4 py-2.5 text-[12px] text-[#5b6573]">
        <span>
          Fonte: <strong className="text-[#1f2937]">{meta.arquivo}</strong> · {meta.totalLinhas}{" "}
          registros
        </span>
        <span>
          Sincronizado em{" "}
          <strong className="text-[#1f2937]">{formatDataHora(meta.lastSync)}</strong>
        </span>
      </div>
    );
  }

  return null;
}
