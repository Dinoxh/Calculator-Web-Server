// Typed client for the calculator endpoints in server.py.
// The session cookie is HttpOnly and same-origin, so fetch sends it automatically.

export type Endpoint = "statement" | "assignment" | "expression" | "term" | "factor";

export type Variables = Record<string, number>;

export type EvalResult =
  | { ok: true; raw: string }
  | { ok: false; error: string };

export async function evaluate(endpoint: Endpoint, line: string): Promise<EvalResult> {
  let res: Response;
  try {
    res = await fetch(`/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: line,
    });
  } catch {
    return { ok: false, error: "Couldn't reach the server." };
  }

  // Read as text rather than res.json(): a huge integer like fac(200) is valid JSON
  // but would lose its digits (or become Infinity) if parsed into a JS number.
  const text = await res.text();
  if (res.ok) return { ok: true, raw: text };
  return { ok: false, error: detailOf(text) ?? `Server error (${res.status})` };
}

export async function getVariables(): Promise<Variables> {
  const res = await fetch("/vars");
  if (!res.ok) throw new Error(`GET /vars failed (${res.status})`);
  return (await res.json()) as Variables;
}

export async function resetVariables(): Promise<Variables> {
  const res = await fetch("/reset", { method: "POST" });
  if (!res.ok) throw new Error(`POST /reset failed (${res.status})`);
  return (await res.json()) as Variables;
}

function detailOf(text: string): string | undefined {
  try {
    const body: unknown = JSON.parse(text);
    if (typeof body === "object" && body !== null && "detail" in body && typeof body.detail === "string") {
      return body.detail;
    }
  } catch {
    // Not JSON, e.g. a plain "Internal Server Error"
  }
  return undefined;
}
