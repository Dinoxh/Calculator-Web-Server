// Display formatting for numbers coming back from the calculator.

/** Format a raw JSON response body ("20.0", "1e+300", "933262154439..."). */
export function formatRaw(raw: string): string {
  const text = raw.trim();
  // Exact integers (fac, fib) are kept digit-for-digit
  if (/^-?\d+$/.test(text)) return text;
  const n = Number(text);
  return Number.isNaN(n) ? text : formatNumber(n);
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return n > 0 ? "∞" : n < 0 ? "-∞" : "NaN";
  if (Object.is(n, -0)) return "0";

  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e15 || abs < 1e-6)) {
    return n.toExponential(9).replace(/\.?0+e/, "e").replace("e+", "e");
  }
  // 12 significant digits hides float noise: 0.1 + 0.2 shows as 0.3
  return String(parseFloat(n.toPrecision(12)));
}
