// Business Mode identity card: a printed, editorial identity card with the
// owner's photograph, name and a few verified details.
//
// Entrance: the card drops in on its lanyard, settles with a small sway (no
// bounce or spin) and then reveals its details. Total ≈1.5 s. It never blocks
// navigation, can be skipped (button or Escape), is replaced by the settled
// card for reduced-motion visitors, and plays once per session.
//
// Uses only verified profile facts. Until the owner's photograph exists, a
// clearly labelled placeholder is shown — never another face.

import { useCallback, useEffect, useRef, useState, type AnimationEvent } from "react";
import { useModeView, SafeLink } from "../../content/components";
import { formatDateRange, hasText } from "../../content/rules";
import { browserEntranceEnvironment, chooseCardEntrance, markCardEntrancePlayed, type CardEntrance } from "./cardEntrance";

type Phase = "dropping" | "settled";

/** Name of the last reveal animation; when it ends the entrance is over. */
const LAST_ANIMATION = "id-card-reveal-last";

export function IdentityCard({ entrance }: { entrance?: CardEntrance }) {
  const { person, portrait, education, contact } = useModeView();
  const photo = portrait.photo;

  const [phase, setPhase] = useState<Phase>(() =>
    (entrance ?? chooseCardEntrance(browserEntranceEnvironment())) === "drop" ? "dropping" : "settled",
  );
  const sectionRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);

  const settle = useCallback((moveFocus: boolean) => {
    setPhase("settled");
    if (moveFocus) nameRef.current?.focus();
  }, []);

  // Start: record the play, or skip it when the card isn't on screen
  // (e.g. the visitor switched modes while reading a later section).
  useEffect(() => {
    if (phase !== "dropping") return;
    const box = sectionRef.current?.getBoundingClientRect();
    if (box && (box.bottom < 0 || box.top > window.innerHeight)) {
      settle(false);
      return;
    }
    markCardEntrancePlayed(browserEntranceEnvironment().session);
    // Run once on mount only.
  }, []);

  // Escape skips the entrance.
  useEffect(() => {
    if (phase !== "dropping") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") settle(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, settle]);

  const onAnimationEnd = (event: AnimationEvent) => {
    if (event.animationName === LAST_ANIMATION) settle(false);
  };

  return (
    <section className="biz-identity" aria-labelledby="biz-identity-name" ref={sectionRef} data-phase={phase}>
      {phase === "dropping" && (
        <button type="button" className="biz-identity__skip" onClick={() => settle(true)}>
          Skip animation
        </button>
      )}
      <div className="id-card-drop" onAnimationEnd={onAnimationEnd}>
        <span className="id-card-drop__strap" aria-hidden="true" />
        <article className="id-card">
          <span className="id-card__slot" aria-hidden="true" />

          <header className="id-card__top">
            <span>Portfolio</span>
            <span>Business edition</span>
          </header>

          <div className="id-card__body">
            <figure className="id-card__photo">
              {photo ? (
                <img
                  className="id-card__image"
                  src={`/${photo.src}`}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                />
              ) : (
                <div
                  className="id-card__placeholder"
                  role="img"
                  aria-label="Photograph placeholder. The photo has not been added yet."
                >
                  <span className="id-card__placeholder-label">Photograph pending</span>
                  <span className="id-card__placeholder-note">A real photograph will appear here.</span>
                </div>
              )}
            </figure>

            <div className="id-card__details">
              <p className="id-card__eyebrow">Identity</p>
              <h1 id="biz-identity-name" className="id-card__name" tabIndex={-1} ref={nameRef}>
                {person?.name}
              </h1>
              {hasText(person?.headline) && <p className="id-card__headline">{person.headline}</p>}

              {(education.length > 0 || contact?.github) && (
                <dl className="id-card__facts">
                  {education.map((e) => (
                    <div key={e.id} className="id-card__fact">
                      <dt>{e.qualification}</dt>
                      <dd>
                        {e.field}
                        <span className="id-card__institution">{[e.institution, formatDateRange(e.dates)].filter(Boolean).join(", ")}</span>
                      </dd>
                    </div>
                  ))}
                  {contact?.github && (
                    <div className="id-card__fact">
                      <dt>GitHub</dt>
                      <dd>
                        <SafeLink href={contact.github.url}>{contact.github.label}</SafeLink>
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
