import test from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_COOKIE_NAME,
  adminCookieHeader,
  clearAdminCookieHeader,
  createAdminToken,
  getAdminCookie,
  getAdminFromRequestSources,
  verifyAdminSessionToken,
} from "../src/lib/admin-auth.ts";

test("admin token roundtrip validates username", async () => {
  const secret = "test-secret";
  const token = await createAdminToken("admin-user", secret);
  const username = await verifyAdminSessionToken(token, secret);
  assert.equal(username, "admin-user");
});

test("invalid admin token is rejected", async () => {
  const secret = "test-secret";
  const username = await verifyAdminSessionToken("broken.token", secret);
  assert.equal(username, null);
});

test("cookie helpers set and clear secure flags", () => {
  const token = "abc.def";
  const setHeader = adminCookieHeader(token, true);
  assert.match(setHeader, new RegExp(`^${ADMIN_COOKIE_NAME}=`));
  assert.match(setHeader, /HttpOnly/);
  assert.match(setHeader, /SameSite=Lax/);
  assert.match(setHeader, /Secure/);

  const clearHeader = clearAdminCookieHeader(true);
  assert.match(clearHeader, /Max-Age=0/);
  assert.match(clearHeader, /Secure/);
});

test("admin token can be resolved from bearer authorization", async () => {
  const secret = "test-secret";
  const token = await createAdminToken("owner", secret);
  const username = await getAdminFromRequestSources({ authorization: `Bearer ${token}` }, secret);
  assert.equal(username, "owner");
});

test("cookie parser returns the admin cookie value", () => {
  const parsed = getAdminCookie("foo=bar; belkou_admin=my-token; other=1");
  assert.equal(parsed, "my-token");
});
