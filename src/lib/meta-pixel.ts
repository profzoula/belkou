import { siteConfig } from "@/lib/site-config";

type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
  push?: unknown;
};

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

export const META_PIXEL_ID = siteConfig.metaPixelId;

function pixel(): FbqFn | undefined {
  if (typeof window === "undefined") return undefined;
  return window.fbq;
}

export function initMetaPixel() {
  if (!META_PIXEL_ID || typeof window === "undefined") return;
  if (window.fbq) return;

  const fbq: FbqFn = (...args: unknown[]) => {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
      return;
    }
    (fbq.queue ??= []).push(args);
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  fbq("init", META_PIXEL_ID);
}

export function trackMetaPageView() {
  pixel()?.("track", "PageView");
}

export function trackMetaEvent(
  name: "ViewContent" | "InitiateCheckout" | "Purchase" | "CompleteRegistration",
  params?: Record<string, string | number | string[] | undefined>,
) {
  const cleaned: Record<string, string | number | string[]> = {};
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) cleaned[key] = value;
    }
  }
  pixel()?.("track", name, cleaned);
}
