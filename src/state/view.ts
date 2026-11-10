// Which top-level view is showing: the portfolio pages or the 3D museum.
// Kept in the URL (?view=museum) so Back/Forward work and links can be
// shared. No server routing is needed: it's a query parameter.

import { useSyncExternalStore } from "react";

export type View = "portfolio" | "museum";
export const VIEW_PARAM = "view";
const NAVIGATE_EVENT = "museum:navigate";

export function viewFromUrl(url: string): View {
  return new URL(url).searchParams.get(VIEW_PARAM) === "museum" ? "museum" : "portfolio";
}

/** URL for a view, keeping other parameters (e.g. ?mode=). The museum has no #section. */
export function urlForView(url: string, view: View): string {
  const next = new URL(url);
  if (view === "museum") {
    next.searchParams.set(VIEW_PARAM, "museum");
    next.hash = "";
  } else {
    next.searchParams.delete(VIEW_PARAM);
  }
  return next.toString();
}

export function navigateToView(view: View): void {
  const target = urlForView(window.location.href, view);
  if (target === window.location.href) return;
  // Mark entries made from inside the app, so "Back to portfolio" can use
  // real browser history instead of stacking new entries.
  window.history.pushState({ ...(window.history.state ?? {}), enteredFromApp: true }, "", target);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

/** Leave the museum: browser Back if we came from the portfolio, else go there. */
export function exitMuseum(): void {
  if ((window.history.state as { enteredFromApp?: boolean } | null)?.enteredFromApp) window.history.back();
  else navigateToView("portfolio");
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  window.addEventListener(NAVIGATE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(NAVIGATE_EVENT, onChange);
  };
}

export function useView(): View {
  return useSyncExternalStore(
    subscribe,
    () => viewFromUrl(window.location.href),
    () => "portfolio",
  );
}
