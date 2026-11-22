import { useRef } from "react";
import type { Mode } from "../data/profile/presentation";

export function ModeSwitch({ mode, onSwitch }: { mode: Mode; onSwitch: (mode: Mode) => void }) {
  const tech = mode === "developer";
  const knobRef = useRef<HTMLSpanElement>(null);

  function toggle() {
    const knob = knobRef.current;
    const track = knob?.parentElement;
    if (knob && track && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const start = getComputedStyle(knob);
      const from = Number.parseFloat(start.left);
      const inset = Number.parseFloat(getComputedStyle(track).paddingLeft);
      const to = tech ? inset : track.clientWidth - knob.offsetWidth - inset;
      const distance = to - from;
      const color = start.backgroundColor;
      const shape = start.transform;
      const nextColor = tech ? "#75213E" : "#C8EA43";
      knob.getAnimations().forEach((animation) => animation.cancel());
      knob.animate([
        { left: `${from}px`, transform: shape, backgroundColor: color, easing: "ease-out" },
        { left: `${from}px`, transform: "scale(0.8)", backgroundColor: color, offset: 0.16, easing: "cubic-bezier(0.45, 0, 0.2, 1)" },
        { left: `${from + distance * 0.75}px`, transform: "scale(1.19, 0.88)", backgroundColor: nextColor, offset: 0.62 },
        { left: `${to + distance * 0.07}px`, transform: "scale(0.94, 1.05)", backgroundColor: nextColor, offset: 0.82, easing: "ease-out" },
        { left: `${to}px`, transform: "scale(1)", backgroundColor: nextColor },
      ], { duration: 640 });
    }
    onSwitch(tech ? "business" : "developer");
  }

  return (
    <button
      id="portfolio-view"
      className="mode-switch"
      type="button"
      role="switch"
      aria-label="Tech view"
      aria-checked={tech}
      onClick={toggle}
    >
      <span className="mode-switch__label mode-switch__label--business" aria-hidden="true">Business</span>
      <span className="mode-switch__track" aria-hidden="true">
        <span className="mode-switch__knob" ref={knobRef} />
      </span>
      <span className="mode-switch__label mode-switch__label--tech" aria-hidden="true">Tech</span>
    </button>
  );
}
