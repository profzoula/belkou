/**
 * Registration status / success context may only be revealed when the caller
 * proves they hold the Square order id stored on the registration row.
 * A bare registration UUID is not enough (IDOR / information disclosure).
 */
export function hasCheckoutOrderProof(
  storedOrderId: string | null | undefined,
  presentedOrderId: string | null | undefined,
): boolean {
  const stored = storedOrderId?.trim();
  const presented = presentedOrderId?.trim();
  return Boolean(stored && presented && stored === presented);
}
