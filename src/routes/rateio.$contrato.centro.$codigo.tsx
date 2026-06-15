import { createFileRoute, notFound } from "@tanstack/react-router";
import { CentroDetalhesPage } from "@/components/CentroDetalhesPage";
import type { ContratoRateio } from "@/lib/rateio-data";

export const Route = createFileRoute("/rateio/$contrato/centro/$codigo")({
  beforeLoad: ({ params }) => {
    if (params.contrato !== "soffner" && params.contrato !== "arklok") {
      throw notFound();
    }
  },
  head: ({ params }) => ({
    meta: [{ title: `Centro ${params.codigo} · Central de Rateio` }],
  }),
  component: DetalhesContrato,
});

function DetalhesContrato() {
  const { contrato, codigo } = Route.useParams();
  return <CentroDetalhesPage contrato={contrato as ContratoRateio} codigo={codigo} />;
}
