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

expect(
  existsSync(join(root, "tests", "admin-auth.test.ts")),
  "Missing critical test: admin auth",
  failures,
);
expect(
  existsSync(join(root, "tests", "checkout-access.test.ts")),
  "Missing critical test: checkout access",
  failures,
);

const webhookSource = readText("src/routes/api/square/webhook.ts");
const idempotencySource = readText("src/server/checkout-webhook-idempotency.ts");
const supabaseRegistrationsSource = readText("src/server/supabase-registrations.ts");
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
  webhookSource.includes("checkout-webhook-idempotency"),
  "Webhook must use shared idempotency module",
  failures,
);
expect(
  idempotencySource.includes("checkout_webhook_events"),
  "Supabase webhook idempotency table integration missing",
  failures,
);
expect(
  !supabaseRegistrationsSource.includes("process.env.SUPABASE_SERVICE_ROLE_KEY ??"),
  "Unsafe SUPABASE key fallback chain detected",
  failures,
);
expect(
  !supabaseRegistrationsSource.includes("process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;"),
  "Unsafe VITE service-role key fallback must be removed",
  failures,
);

const serverSource = readText("scripts/railway.mjs");
expect(
  serverSource.includes('pathname === "/healthz"'),
  "Health endpoint /healthz missing",
  failures,
);
expect(
  serverSource.includes("VITE_SUPABASE_URL"),
  "Health check must accept VITE_SUPABASE_URL fallback",
  failures,
);

const ciWorkflow = readText(".github/workflows/ci.yml");
expect(ciWorkflow.includes("npm run lint"), "CI does not run lint", failures);
expect(ciWorkflow.includes("npm run test:ci"), "CI does not run runtime tests", failures);
expect(
  ciWorkflow.includes("npm run audit:release"),
  "CI does not run release audit checks",
  failures,
);

expect(existsSync(join(root, ".github/workflows/deploy.yml")), "Missing deploy workflow", failures);

const deployWorkflow = readText(".github/workflows/deploy.yml");
expect(deployWorkflow.includes("railway up"), "Deploy workflow must invoke Railway CLI", failures);

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
