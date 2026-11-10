// The first screen: a short, clear choice between the two visual modes.
//
// Both halves are rendered in their own mode's tokens (data-mode on the
// panel), so the visitor previews each look before choosing. The copy makes
// clear that both modes contain the same person and the same work.

import { useEffect, useRef } from "react";
import type { Mode } from "../data/profile/presentation";

interface Option {
  mode: Mode;
  kicker: string;
  title: string;
  description: string;
  emphasis: string[];
}

export const MODE_OPTIONS: readonly Option[] = [
  {
    mode: "developer",
    kicker: "$ open --mode developer",
    title: "Developer",
    description: "Leads with projects, code and the technical stack.",
    emphasis: ["Projects", "Skills", "Engineering"],
  },
  {
    mode: "business",
    kicker: "Edition No. 02",
    title: "Business",
    description: "Leads with education, business thinking and communication.",
    emphasis: ["Education", "Experience", "Strategy"],
  },
];

export function ModeChooser({
  name,
  onChoose,
  focusOnMount = false,
}: {
  name: string;
  onChoose: (mode: Mode) => void;
  /** Move focus to the heading (used when returning here from a mode). */
  focusOnMount?: boolean;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus();
  }, [focusOnMount]);

  return (
    <main className="chooser">
      <header className="chooser__header">
        <div className="chooser__intro">
          <p className="chooser__eyebrow">The Museum of Barsa</p>
          <h1 className="chooser__name" ref={headingRef} tabIndex={-1}>
            {name}
          </h1>
          <p className="chooser__lede" id="chooser-lede">
            One portfolio, two ways to read it. Both modes hold the same projects, education and experience.
          </p>
        </div>
      </header>

      <div className="chooser__options" role="group" aria-labelledby="chooser-question">
        <h2 id="chooser-question" className="visually-hidden">
          Choose a mode
        </h2>
        {MODE_OPTIONS.map((option) => (
          <button
            key={option.mode}
            type="button"
            className={`chooser__option chooser__option--${option.mode}`}
            data-mode={option.mode}
            aria-labelledby={`chooser-${option.mode}-title`}
            aria-describedby={`chooser-${option.mode}-desc chooser-lede`}
            onClick={() => onChoose(option.mode)}
          >
            <span className="chooser__kicker" aria-hidden="true">
              {option.kicker}
            </span>
            <span className="chooser__title" id={`chooser-${option.mode}-title`}>
              {option.title}
            </span>
            <span className="chooser__desc" id={`chooser-${option.mode}-desc`}>
              {option.description}
            </span>
            <span className="chooser__emphasis" aria-hidden="true">
              {option.emphasis.join(" · ")}
            </span>
            <span className="chooser__cta" aria-hidden="true">
              Enter {option.title} mode <span className="chooser__arrow">→</span>
            </span>
          </button>
        ))}
      </div>

      <p className="chooser__note">Your choice is remembered on this device. You can switch modes at any time.</p>
    </main>
  );
}
