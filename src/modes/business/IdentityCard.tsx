import { useCallback, useEffect, useRef, useState, type AnimationEvent, type CSSProperties, type PointerEvent } from "react";
import { useModeView } from "../../content/components";
import { hasText } from "../../content/rules";
import { browserEntranceEnvironment, chooseCardEntrance, markCardEntrancePlayed, type CardEntrance } from "./cardEntrance";

type Phase = "dropping" | "settled";

/** Name of the last reveal animation; when it ends the entrance is over. */
const LAST_ANIMATION = "id-card-reveal-last";

export function IdentityCard({ entrance }: { entrance?: CardEntrance }) {
  const { person, portrait, education } = useModeView();
  const photo = portrait.photo;
  const hanger = useRef<HTMLDivElement>(null);
  const tiltPlane = useRef<HTMLDivElement>(null);
  const swivel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const swinging = useRef<Animation | null>(null);
  const [halfTurns, setHalfTurns] = useState(0);
  const flipped = Math.abs(halfTurns % 2) === 1;

  function startDrag(event: PointerEvent<HTMLButtonElement>) {
    dragged.current = false;
    if (event.button !== 0 || drag.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    swinging.current?.cancel();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const start = drag.current;
    if (!start && event.pointerType === "mouse" && tiltPlane.current) {
      const bounds = event.currentTarget.getBoundingClientRect();
      tiltPlane.current.style.setProperty("--tilt-x", `${(0.5 - (event.clientY - bounds.top) / bounds.height) * 22}deg`);
      tiltPlane.current.style.setProperty("--tilt-y", `${((event.clientX - bounds.left) / bounds.width - 0.5) * 30}deg`);
      return;
    }
    if (!start || start.id !== event.pointerId || !hanger.current) return;
    const horizontal = event.clientX - start.x;
    if (Math.hypot(horizontal, event.clientY - start.y) > 6) dragged.current = true;
    if (swivel.current) {
      swivel.current.dataset.dragging = "true";
      swivel.current.style.setProperty("--drag-turn", `${Math.max(-105, Math.min(105, horizontal * 1.35))}deg`);
    }
    const tilt = Math.max(-17, Math.min(17, horizontal / 8));
    const pull = Math.max(-12, Math.min(30, event.clientY - start.y));
    hanger.current.style.transform = `translateY(${pull}px) rotate(${tilt}deg)`;
  }

  function resetTilt() {
    tiltPlane.current?.style.removeProperty("--tilt-x");
    tiltPlane.current?.style.removeProperty("--tilt-y");
  }

  function releaseDrag(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.id !== event.pointerId || !hanger.current) return;
    const horizontal = event.clientX - drag.current.x;
    if (event.type === "pointerup" && Math.abs(horizontal) >= 64) {
      setHalfTurns((turns) => turns + Math.sign(horizontal));
    }
    drag.current = null;
    if (swivel.current) {
      delete swivel.current.dataset.dragging;
      swivel.current.style.removeProperty("--drag-turn");
    }
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

  // Skip the entrance when a section link opens below the badge.
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
            <div className="id-card-tilt" ref={tiltPlane}>
              <div className="id-card-rotation" data-flipped={flipped} ref={swivel} style={{ "--face-turn": `${halfTurns * 180}deg` } as CSSProperties}>
                <div className="id-card-sleeve id-card-face id-card-face--front" aria-hidden={flipped}>
                  <span className="id-card-sleeve__slot" aria-hidden="true" />
                  <article className="id-card">
                    <header className="id-card__top">
                      <span>Portfolio</span>
                    </header>

                    <div className="id-card__body">
                      <div className="id-card__photo">
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
                      </div>
                    </div>

                    {hasText(person?.headline) && <p className="id-card__headline">{person.headline}</p>}
                  </article>
                </div>
                <div className="id-card-face id-card-face--back" aria-hidden={!flipped}>
                  <span className="id-card__reverse-label">Portfolio</span>
                  <strong>{person?.name}</strong>
                  <ul className="id-card__reverse-details">
                    {education.map((degree) => <li key={degree.id}>{degree.qualification} · {degree.field}</li>)}
                  </ul>
                </div>
              </div>
              <button
                className="id-card-hit-area"
                type="button"
                aria-label="Flip badge"
                aria-pressed={flipped}
                onPointerDown={startDrag}
                onPointerMove={moveDrag}
                onPointerUp={releaseDrag}
                onPointerCancel={releaseDrag}
                onLostPointerCapture={releaseDrag}
                onPointerLeave={resetTilt}
                onClick={(event) => {
                  if (event.detail === 0 || !dragged.current) {
                    resetTilt();
                    setHalfTurns((turns) => turns + 1);
                    sway("rotate(-4deg)");
                  }
                  dragged.current = false;
                }}
              >
                <span>Flip badge <span aria-hidden="true">↻</span></span>
              </button>
            </div>
          </div>
        </div>
        <h1 id="biz-identity-name" className="biz-identity__name" tabIndex={-1} ref={nameRef}>
          {person?.name}
        </h1>
        <button className="biz-identity__replay" type="button" onClick={() => {
          resetTilt();
          setHalfTurns(0);
          setPhase("dropping");
        }}>Replay 3D entrance</button>
      </div>
    </section>
  );
}
