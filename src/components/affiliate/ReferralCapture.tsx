import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { saveReferralCode } from "@/lib/referral-storage";

export function ReferralCapture() {
  const search = useRouterState({ select: (s) => s.location.search });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(search);
    const ref = params.get("ref");
    if (ref) saveReferralCode(ref);
  }, [search]);

  return null;
}
