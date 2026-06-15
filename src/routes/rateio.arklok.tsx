import { createFileRoute } from "@tanstack/react-router";
import { RateioContratoPage } from "@/components/RateioContratoPage";

export const Route = createFileRoute("/rateio/arklok")({
  head: () => ({
    meta: [
      { title: "Contrato ARKLOK · Central de Rateio" },
      {
        name: "description",
        content: "Consulta de notebooks vinculados aos centros de custo do contrato ARKLOK.",
      },
    ],
  }),
  component: () => <RateioContratoPage contrato="arklok" />,
});
