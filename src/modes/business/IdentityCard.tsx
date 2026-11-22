import { useCallback, useEffect, useRef, useState, type AnimationEvent, type PointerEvent, type ReactNode } from "react";
import { useModeView } from "../../content/components";
import { hasText } from "../../content/rules";
import { browserEntranceEnvironment, chooseCardEntrance, markCardEntrancePlayed, type CardEntrance } from "./cardEntrance";

type Phase = "dropping" | "settled";

/** Name of the last reveal animation; when it ends the entrance is over. */
const LAST_ANIMATION = "id-card-reveal-last";

export function IdentityCard({ entrance, modeControl }: { entrance?: CardEntrance; modeControl?: ReactNode }) {
  const { mode, person, portrait } = useModeView();
  const photo = portrait.photo;
  const hanger = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const swinging = useRef<Animation | null>(null);

  function startDrag(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || drag.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    swinging.current?.cancel();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const start = drag.current;
    if (!start || start.id !== event.pointerId || !hanger.current) return;
    const tilt = Math.max(-24, Math.min(24, (event.clientX - start.x) / 5));
    const pull = Math.max(-12, Math.min(30, event.clientY - start.y));
    hanger.current.style.transform = `translateY(${pull}px) rotate(${tilt}deg)`;
  }

  function releaseDrag(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.id !== event.pointerId || !hanger.current) return;
    drag.current = null;
    const from = hanger.current.style.transform;
    hanger.current.style.removeProperty("transform");
    if (from) sway(from);
  }

  function sway(from = "rotate(10deg)") {
    if (!hanger.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    swinging.current?.cancel();
    swinging.current = hanger.current.animate(
      [{ transform: from }, { transform: "rotate(-5deg)", offset: 0.46 }, { transform: "none" }],
      { duration: 570, easing: "ease-out" },
    );
  }

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
      <div className="biz-identity__stage">
        <div className="id-card-hanger" ref={hanger}>
          <div className="id-card-drop" onAnimationEnd={onAnimationEnd}>
            <span className="id-card-drop__strap" aria-hidden="true" />
            <span className="id-card-drop__clip" aria-hidden="true" />
            <div className="id-card-sleeve">
              <span className="id-card-sleeve__slot" aria-hidden="true" />
              <article className="id-card">
                <header className="id-card__top">
                  <span>Museum Pass</span>
                  <span>{mode === "business" ? "Business" : "Tech"}</span>
                </header>

                <div className="id-card__body">
                  <button
                    className="id-card__photo"
                    type="button"
                    aria-label="Swing the museum pass"
                    onPointerDown={startDrag}
                    onPointerMove={moveDrag}
                    onPointerUp={releaseDrag}
                    onPointerCancel={releaseDrag}
                    onLostPointerCapture={releaseDrag}
                    onClick={(event) => { if (event.detail === 0) sway(); }}
                  >
                    {photo ? (
                      <img
                        className="id-card__image"
                        draggable={false}
                        src={`/${photo.src}`}
                        alt={photo.alt}
                        width={photo.width}
                        height={photo.height}
                      />
                    ) : (
                      <span
                        className="id-card__placeholder"
                        role="img"
                        aria-label="Photograph placeholder. The photo has not been added yet."
                      >
                        <span className="id-card__placeholder-label">Photograph pending</span>
                        <span className="id-card__placeholder-note">A real photograph will appear here.</span>
                      </span>
                    )}
                  </button>
                </div>

                {hasText(person?.headline) && <p className="id-card__headline">{person.headline}</p>}
              </article>
            </div>
          </div>
        </div>
        <h1 id="biz-identity-name" className="biz-identity__name" tabIndex={-1} ref={nameRef}>
          {person?.name}
        </h1>
        {modeControl}
      </div>
    </section>
  );
}
