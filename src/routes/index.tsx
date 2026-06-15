import { createFileRoute, Link } from "@tanstack/react-router";
import { PortalLayout } from "@/components/PortalLayout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portal de Rateios" },
      {
        name: "description",
        content: "Portal interno para consulta dos contratos de rateio de equipamentos.",
      },
    ],
  }),
  component: PortalRateios,
});

const contratos = [
  {
    nome: "SOFFNER",
    descricao: "Consulta de notebooks vinculados aos centros de custo.",
    destino: "/rateio/soffner" as const,
    status: "Disponível",
  },
  {
    nome: "ARKLOK",
    descricao: "Consulta de notebooks vinculados aos centros de custo.",
    destino: "/rateio/arklok" as const,
    status: "Em preparação",
  },
];

function PortalRateios() {
  return (
    <PortalLayout>
      <section className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1d3557]">Portal de Rateios</h1>
        <p className="mt-1 max-w-3xl text-sm text-[#5b6573]">
          Selecione um contrato para consultar os equipamentos e informações de rateio.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {contratos.map((contrato) => (
          <Link
            key={contrato.nome}
            to={contrato.destino}
            className="group block rounded-sm border border-[#dfe3e8] bg-white p-6 transition-all duration-200 hover:border-[#1d3557] hover:shadow-[0_4px_12px_rgba(29,53,87,0.08)]"
          >
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 text-[11px] uppercase tracking-wider text-[#5b6573]">
                  Contrato
                </div>
                <h2 className="text-xl font-semibold text-[#1d3557]">{contrato.nome}</h2>
              </div>
            </div>

            <div className="flex items-end justify-between gap-4 border-t border-[#eef0f3] pt-4">
              <p className="text-sm text-[#5b6573]">{contrato.descricao}</p>
              <span className="text-lg text-[#1d3557] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                →
              </span>
            </div>
          </Link>
        ))}
      </section>
    </PortalLayout>
  );
}
