import { createServerFn } from "@tanstack/react-start";

export const getRateioData = createServerFn({ method: "GET" }).handler(async () => {
  const { carregarRateioDoSharePoint } = await import("./sharepoint.server");
  try {
    const payload = await carregarRateioDoSharePoint();
    return { ok: true as const, payload };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false as const, error: msg };
  }
});
