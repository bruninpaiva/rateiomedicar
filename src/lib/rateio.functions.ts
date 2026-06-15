import { createServerFn } from "@tanstack/react-start";

export const getRateioData = createServerFn({ method: "GET" }).handler(async () => {
  const { carregarRateioSoffner } = await import("./adapters/soffner.server");
  try {
    const payload = await carregarRateioSoffner();
    return { ok: true as const, payload };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false as const, error: msg };
  }
});

export const getRateioArklokData = createServerFn({ method: "GET" }).handler(async () => {
  const { carregarRateioArklok } = await import("./adapters/arklok.server");
  try {
    const payload = await carregarRateioArklok();
    return { ok: true as const, payload };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false as const, error: msg };
  }
});
