export async function baixarPlanilhaSharePoint(url: string): Promise<ArrayBuffer> {
  const r1 = await fetch(url, { redirect: "manual" });
  if (r1.status === 200) return await r1.arrayBuffer();
  if (r1.status !== 301 && r1.status !== 302) {
    throw new Error(`Falha ao acessar o SharePoint (HTTP ${r1.status}).`);
  }

  const loc = r1.headers.get("location");
  if (!loc) throw new Error("SharePoint retornou redirect sem header Location.");

  const headers = r1.headers as Headers & { getSetCookie?: () => string[] };
  const setCookies =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : [r1.headers.get("set-cookie") ?? ""];
  const cookie = setCookies
    .filter(Boolean)
    .map((value) => value.split(";")[0])
    .join("; ");

  if (!cookie) throw new Error("SharePoint não retornou cookie de sessão anônima.");

  const next = new URL(loc, new URL(url).origin).toString();
  const r2 = await fetch(next, { headers: { cookie }, redirect: "follow" });
  if (!r2.ok) throw new Error(`Falha ao baixar o arquivo (HTTP ${r2.status}).`);
  return await r2.arrayBuffer();
}

export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const normalized = value
      .replace(/[R$\s.]/g, "")
      .replace(",", ".")
      .replace("%", "");
    const number = Number(normalized);
    return Number.isNaN(number) ? 0 : number;
  }
  return 0;
}
