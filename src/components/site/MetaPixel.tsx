import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { initMetaPixel, META_PIXEL_ID, trackMetaPageView } from "@/lib/meta-pixel";

export function MetaPixel() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    initMetaPixel();
  }, []);

  useEffect(() => {
    if (!META_PIXEL_ID) return;
    if (pathname.startsWith("/admin")) return;
    trackMetaPageView();
  }, [pathname]);

  return null;
}
