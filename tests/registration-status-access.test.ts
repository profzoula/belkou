import assert from "node:assert/strict";
import { hasCheckoutOrderProof } from "../src/lib/registration-status-access.ts";

assert.equal(hasCheckoutOrderProof("ord_abc", "ord_abc"), true);
assert.equal(hasCheckoutOrderProof("  ord_abc  ", "ord_abc"), true);
assert.equal(hasCheckoutOrderProof("ord_abc", "ord_other"), false);
assert.equal(hasCheckoutOrderProof(null, "ord_abc"), false);
assert.equal(hasCheckoutOrderProof("ord_abc", undefined), false);
assert.equal(hasCheckoutOrderProof("", ""), false);
assert.equal(hasCheckoutOrderProof(null, null), false);

console.log("registration-status-access: ok");
