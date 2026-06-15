import { createFileRoute } from "@tanstack/react-router";
import { CentroDetalhesPage } from "@/components/CentroDetalhesPage";

export const Route = createFileRoute("/centro/$codigo")({
  head: ({ params }) => ({
    meta: [{ title: `Centro ${params.codigo} · Central de Rateio` }],
  }),
  component: DetalhesSoffner,
});

function DetalhesSoffner() {
  const { codigo } = Route.useParams();
  return <CentroDetalhesPage contrato="soffner" codigo={codigo} />;
}
