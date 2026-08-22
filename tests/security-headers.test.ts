import test from "node:test";
import assert from "node:assert/strict";
import { SECURITY_HEADERS, withSecurityHeaders } from "../src/lib/security-headers.ts";

const required = [
  "Strict-Transport-Security",
  "Content-Security-Policy",
  "X-Frame-Options",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
];

test("security headers cover the securityheaders.com baseline", () => {
  for (const name of required) {
    assert.ok(SECURITY_HEADERS[name], `missing ${name}`);
  }
  assert.match(SECURITY_HEADERS["Strict-Transport-Security"], /max-age=31536000/);
  assert.match(SECURITY_HEADERS["Strict-Transport-Security"], /includeSubDomains/);
  assert.equal(SECURITY_HEADERS["X-Frame-Options"], "SAMEORIGIN");
  assert.equal(SECURITY_HEADERS["X-Content-Type-Options"], "nosniff");
});

test("withSecurityHeaders does not drop existing response headers", () => {
  const response = withSecurityHeaders(
    new Response("ok", { headers: { "content-type": "text/plain", "x-custom": "keep" } }),
  );
  assert.equal(response.headers.get("content-type"), "text/plain");
  assert.equal(response.headers.get("x-custom"), "keep");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
});
