/** Round to cents before formatting so floating point never leaks into a price. */
export function toMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Single money formatter for the whole purchase funnel: "$9.99". */
export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toMoney(value));
}
