// When the Business identity card should play its drop-in entrance.
//
// - Never for visitors who prefer reduced motion.
// - Once per browser session, so reloading or switching back and forth
//   doesn't replay it.
// - Storage may be blocked; then it simply plays each time the card mounts.

export const CARD_PLAYED_KEY = "museum-card-dropped";

export type CardEntrance = "drop" | "none";

export interface EntranceEnvironment {
  prefersReducedMotion: boolean;
  session: Pick<Storage, "getItem" | "setItem"> | null;
}

export function chooseCardEntrance(env: EntranceEnvironment): CardEntrance {
  if (env.prefersReducedMotion) return "none";
  try {
    if (env.session?.getItem(CARD_PLAYED_KEY) === "1") return "none";
  } catch {
    /* storage blocked: treat as not played */
  }
  return "drop";
}

export function markCardEntrancePlayed(session: EntranceEnvironment["session"]): void {
  try {
    session?.setItem(CARD_PLAYED_KEY, "1");
  } catch {
    /* storage blocked */
  }
}

/** Reads the real browser environment (safe to call during server rendering). */
export function browserEntranceEnvironment(): EntranceEnvironment {
  if (typeof window === "undefined") return { prefersReducedMotion: true, session: null };
  let session: EntranceEnvironment["session"] = null;
  try {
    session = window.sessionStorage;
  } catch {
    session = null;
  }
  return {
    prefersReducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    session,
  };
}
