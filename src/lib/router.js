import { useEffect, useState } from "react";

/** Tiny hash router. Returns { base, id } and a navigate() helper. */
export function useHashRoute() {
  const [hash, setHash] = useState(() => location.hash || "#/pulse");
  useEffect(() => {
    const onChange = () => setHash(location.hash || "#/pulse");
    window.addEventListener("hashchange", onChange);
    if (!location.hash) location.hash = "#/pulse";
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  const parts = hash.replace(/^#\//, "").split("/");
  return { hash, base: parts[0] || "pulse", id: parts[1], sub: parts[2], full: hash };
}

export function navigate(route) {
  if (location.hash === route) window.dispatchEvent(new HashChangeEvent("hashchange"));
  else location.hash = route;
}
