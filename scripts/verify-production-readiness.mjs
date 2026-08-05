import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function readText(path) {
  return readFileSync(join(root, path), "utf8");
}

function expect(condition, message, failures) {
  if (!condition) failures.push(message);
}

const failures = [];

const packageJson = JSON.parse(readText("package.json"));
const scripts = packageJson.scripts ?? {};

expect(Boolean(scripts.test), "Missing npm script: test", failures);
expect(Boolean(scripts["test:ci"]), "Missing npm script: test:ci", failures);
expect(Boolean(scripts.typecheck), "Missing npm script: typecheck", failures);
expect(Boolean(scripts.build), "Missing npm script: build", failures);

expect(existsSync(join(root, "tests", "admin-auth.test.ts")), "Missing critical test: admin auth", failures);
expect(
  existsSync(join(root, "tests", "stripe-access.test.ts")),
  "Missing critical test: stripe access",
  failures,
);

const webhookSource = readText("src/routes/api/stripe/webhook.ts");
expect(
  webhookSource.includes("requireRegistrationMetadata: true"),
  "Webhook strict registration metadata check not enabled",
  failures,
);
expect(
  webhookSource.includes("requireAmountAndCurrencyMatch: true"),
  "Webhook strict amount/currency check not enabled",
  failures,
);
expect(
  webhookSource.includes("stripe_webhook_events"),
  "Webhook idempotency table is missing",
  failures,
);

const serverSource = readText("scripts/railway.mjs");
expect(serverSource.includes('pathname === "/healthz"'), "Health endpoint /healthz missing", failures);

expect(existsSync(join(root, "README.md")), "Missing root README.md", failures);
expect(
  existsSync(join(root, "docs", "operations", "rollback-runbook.md")),
  "Missing rollback runbook",
  failures,
);

if (failures.length) {
  console.error("[BelKou] Production readiness checks failed:");
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log("[BelKou] Production readiness checks passed.");
