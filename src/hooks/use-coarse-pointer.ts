import { useEffect, useState } from "react";

const COARSE_POINTER_QUERY = "(pointer: coarse)";

function matchCoarsePointer() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(COARSE_POINTER_QUERY).matches;
}

/** True on touch devices (phones, tablets), where native video fullscreen must stay available. */
export function useCoarsePointer() {
  const [coarse, setCoarse] = useState(matchCoarsePointer);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(COARSE_POINTER_QUERY);
    const onChange = () => setCoarse(query.matches);
    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return coarse;
}
