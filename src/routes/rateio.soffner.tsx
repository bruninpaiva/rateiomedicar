import { createFileRoute } from "@tanstack/react-router";
import { RateioContratoPage } from "@/components/RateioContratoPage";

export const Route = createFileRoute("/rateio/soffner")({
  head: () => ({
    meta: [
      { title: "Contrato SOFFNER · Central de Rateio" },
      {
        name: "description",
        content: "Consulta de notebooks vinculados aos centros de custo do contrato SOFFNER.",
      },
    ],
  }),
  component: () => <RateioContratoPage contrato="soffner" />,
});
