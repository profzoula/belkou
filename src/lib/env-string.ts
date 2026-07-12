/** Treat blank env values as unset so UI never shows empty labels. */
export function envString(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}
