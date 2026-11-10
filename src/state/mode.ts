// Visual mode state: initial choice, switching and preference persistence.
//
// Rules:
// - No mode yet → the visitor sees the mode-selection screen (mode = null).
// - A mode chosen by the visitor is remembered in localStorage.
// - `?mode=developer|business` in the URL wins for that visit (shareable
//   links) but is NOT saved: the visitor didn't choose it themselves.
// - Switching keeps the current path and #section, so the visitor stays in
//   the equivalent place; only the `mode` query parameter is updated if present.
// - `forget()` clears the saved preference and returns to the selection screen.
// - Storage may be unavailable (private windows); everything still works in
//   memory, the choice just isn't remembered.
//
// Browser objects are injected so the logic is testable without a DOM.

import { MODES, type Mode } from "../data/profile/presentation";

export const STORAGE_KEY = "museum-mode";
export const URL_PARAM = "mode";

/** Where the current mode came from. */
export type ModeSource = "url" | "stored" | "chosen" | "none";

export interface ModeState {
  /** `null` means no mode yet: show the selection screen. */
  mode: Mode | null;
  source: ModeSource;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface RootLike {
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

export interface ModeEnvironment {
  storage?: StorageLike | null;
  /** Usually `document.documentElement`; receives `data-mode`. */
  root?: RootLike | null;
  /** Current page URL. */
  getUrl?: () => string;
  /** Replace the URL without navigation (`history.replaceState`). */
  replaceUrl?: (url: string) => void;
}

export function parseMode(value: unknown): Mode | null {
  return typeof value === "string" && (MODES as readonly string[]).includes(value) ? (value as Mode) : null;
}

function safeRead(storage: StorageLike | null | undefined): string | null {
  try {
    return storage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

function safeWrite(storage: StorageLike | null | undefined, value: string | null): void {
  try {
    if (!storage) return;
    if (value === null) storage.removeItem(STORAGE_KEY);
    else storage.setItem(STORAGE_KEY, value);
  } catch {
    /* storage blocked: keep working in memory */
  }
}

/** Works out the mode for a fresh page load. */
export function resolveInitialMode(env: ModeEnvironment): ModeState {
  if (env.getUrl) {
    const fromUrl = parseMode(new URL(env.getUrl()).searchParams.get(URL_PARAM));
    if (fromUrl) return { mode: fromUrl, source: "url" };
  }
  const raw = safeRead(env.storage);
  const stored = parseMode(raw);
  if (stored) return { mode: stored, source: "stored" };
  // Clear corrupt or outdated values so they don't linger.
  if (raw !== null) safeWrite(env.storage, null);
  return { mode: null, source: "none" };
}

/**
 * Returns `url` with the mode set (or removed when `mode` is null), keeping
 * the path, other parameters and the #section hash.
 */
export function urlWithMode(url: string, mode: Mode | null): string {
  const next = new URL(url);
  if (mode) next.searchParams.set(URL_PARAM, mode);
  else next.searchParams.delete(URL_PARAM);
  return next.toString();
}

export type ModeListener = (state: ModeState) => void;

export function createModeStore(env: ModeEnvironment = {}) {
  let state = resolveInitialMode(env);
  const listeners = new Set<ModeListener>();

  function apply(): void {
    if (state.mode) env.root?.setAttribute("data-mode", state.mode);
    else env.root?.removeAttribute("data-mode");
  }

  function syncUrl(): void {
    if (!env.getUrl || !env.replaceUrl) return;
    const current = env.getUrl();
    // Only rewrite links that already carry a mode, so ordinary URLs stay clean.
    if (!new URL(current).searchParams.has(URL_PARAM)) return;
    const next = urlWithMode(current, state.mode);
    if (next !== current) env.replaceUrl(next);
  }

  function set(next: ModeState): void {
    if (next.mode === state.mode && next.source === state.source) return;
    state = next;
    apply();
    syncUrl();
    for (const listener of listeners) listener(state);
  }

  apply();

  return {
    get: (): ModeState => state,

    /** The visitor chose or switched mode. Remembered unless `remember` is false. */
    choose(mode: Mode, options: { remember?: boolean } = {}): void {
      if (options.remember ?? true) safeWrite(env.storage, mode);
      set({ mode, source: "chosen" });
    },

    /** Switch to the other mode (no-op before a mode has been chosen). */
    toggle(): void {
      if (state.mode) this.choose(state.mode === "developer" ? "business" : "developer");
    },

    /** Clear the saved preference and return to the selection screen. */
    forget(): void {
      safeWrite(env.storage, null);
      set({ mode: null, source: "none" });
    },

    subscribe(listener: ModeListener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export type ModeStore = ReturnType<typeof createModeStore>;

/** Store wired to the real browser. */
export function createBrowserModeStore(): ModeStore {
  let storage: StorageLike | null = null;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }
  return createModeStore({
    storage,
    root: document.documentElement,
    getUrl: () => window.location.href,
    replaceUrl: (url) => window.history.replaceState(window.history.state, "", url),
  });
}
