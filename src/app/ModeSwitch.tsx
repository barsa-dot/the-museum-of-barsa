// Visible but unobtrusive control for switching modes after entering.

import { MODES, type Mode } from "../data/profile/presentation";

const LABELS: Record<Mode, string> = { developer: "Developer", business: "Business" };

export function ModeSwitch({ mode, onSwitch }: { mode: Mode; onSwitch: (mode: Mode) => void }) {
  return (
    <div className="mode-switch" role="group" aria-label="Visual mode">
      {MODES.map((m) => (
        <button
          key={m}
          type="button"
          className="mode-switch__option"
          aria-pressed={m === mode}
          onClick={() => {
            if (m !== mode) onSwitch(m);
          }}
        >
          {LABELS[m]}
        </button>
      ))}
    </div>
  );
}

/**
 * The section currently being read: the last section whose top has passed
 * the upper third of the viewport. Used to keep the visitor's place when
 * switching modes (both modes use the same section ids).
 */
export function currentSectionId(doc: Document = document, viewportHeight = window.innerHeight): string | null {
  let current: string | null = null;
  for (const section of doc.querySelectorAll<HTMLElement>("main section[id]")) {
    if (section.getBoundingClientRect().top <= viewportHeight / 3) current = section.id;
  }
  return current;
}
