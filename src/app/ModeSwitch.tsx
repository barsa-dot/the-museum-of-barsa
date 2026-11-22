import type { Mode } from "../data/profile/presentation";

export function ModeSwitch({ mode, onSwitch }: { mode: Mode; onSwitch: (mode: Mode) => void }) {
  const tech = mode === "developer";
  return (
    <button
      id="portfolio-view"
      className="mode-switch"
      type="button"
      role="switch"
      aria-label="Tech view"
      aria-checked={tech}
      onClick={() => onSwitch(tech ? "business" : "developer")}
    >
      <span className="mode-switch__label mode-switch__label--business" aria-hidden="true">Business</span>
      <span className="mode-switch__track" aria-hidden="true" />
      <span className="mode-switch__label mode-switch__label--tech" aria-hidden="true">Tech</span>
    </button>
  );
}
