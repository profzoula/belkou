type AlertLevel = "warning" | "error";

const throttle = new Map<string, number>();
const THROTTLE_MS = 5 * 60_000;

function shouldSend(key: string): boolean {
  const now = Date.now();
  const last = throttle.get(key) ?? 0;
  if (now - last < THROTTLE_MS) return false;
  throttle.set(key, now);
  return true;
}

export async function sendOpsAlert(params: {
  key: string;
  title: string;
  message: string;
  level?: AlertLevel;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const webhookUrl = process.env.OPS_ALERT_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;
  if (!shouldSend(params.key)) return;

  const payload = {
    service: "belkou-web",
    level: params.level ?? "error",
    title: params.title,
    message: params.message,
    meta: params.meta ?? {},
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn("[BelKou] ops alert send failed:", error);
  }
}
