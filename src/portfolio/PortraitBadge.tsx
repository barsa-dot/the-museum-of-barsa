import { useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { portrait } from "./projects";
import "./badge.css";

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

export function PortraitBadge({ mount }: { mount: RefObject<HTMLDivElement | null> }) {
  const carriage = useRef<HTMLDivElement>(null);
  const strap = useRef<SVGPathElement>(null);
  const control = useRef<HTMLButtonElement>(null);
  const [flipped, setFlipped] = useState(false);
  const [used, setUsed] = useState(false);
  const suppressClick = useRef(false);

  useLayoutEffect(() => {
    const card = carriage.current!;
    const button = control.current!;
    const line = strap.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const events = new AbortController();
    const { signal } = events;
    let x = 0, y = 0, vx = 0, vy = 0;
    let hang = card.offsetTop;
    let frame = 0;
    let previous = 0;
    let falling = false;
    let grab: {
      id: number; startX: number; startY: number; originX: number; originY: number;
      time: number; dragged: boolean;
    } | undefined;

    const paint = () => {
      card.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      button.style.setProperty("--badge-angle", `${clamp(x * .105 + vx * .007, 23)}deg`);
      const end = hang + y - 6;
      line.setAttribute("d", `M 0 -26 Q ${x * .39} ${(end - 26) * .48} ${x} ${end}`);
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
    };

    const tick = (now: number) => {
      const dt = previous ? Math.min(.032, (now - previous) / 1000) : 1 / 60;
      previous = now;
      if (falling) {
        vy += 2950 * dt;
        y += vy * dt;
        x += vx * dt;
        if (y >= 0) {
          y = 0;
          vy = Math.min(vy, 390);
          falling = false;
        }
      } else {
        vx += (-83 * x - 10 * vx) * dt;
        vy += (-208 * y - 18 * vy) * dt;
        x += vx * dt;
        y += vy * dt;
      }
      if (!falling && Math.abs(x) + Math.abs(y) < .5 && Math.abs(vx) + Math.abs(vy) < 4) {
        x = y = vx = vy = 0;
        paint();
        stop();
        return;
      }
      paint();
      frame = requestAnimationFrame(tick);
    };

    const resume = () => { if (!frame && !reduced.matches) frame = requestAnimationFrame(tick); };
    const resize = () => {
      hang = card.offsetTop;
      paint();
    };
    const motionChange = () => {
      if (!reduced.matches) return;
      stop();
      falling = false;
      x = y = vx = vy = 0;
      paint();
    };

    const down = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0 || reduced.matches) return;
      stop();
      falling = false;
      suppressClick.current = false;
      grab = {
        id: event.pointerId, startX: event.clientX, startY: event.clientY,
        originX: x, originY: y, time: event.timeStamp, dragged: false,
      };
      button.setPointerCapture(event.pointerId);
    };

    const move = (event: PointerEvent) => {
      if (!grab || event.pointerId !== grab.id || reduced.matches) return;
      const dx = event.clientX - grab.startX;
      const dy = event.clientY - grab.startY;
      if (!grab.dragged) {
        if (Math.hypot(dx, dy) < 7) return;
        grab.dragged = true;
        setUsed(true);
        button.dataset.dragging = "true";
        vx = vy = 0;
      }
      const nextX = clamp(grab.originX + dx, Math.max(38, Math.min(290, innerWidth / 2 - button.offsetWidth * .65)));
      const nextY = Math.max(-hang * .8, Math.min(innerHeight * .18, grab.originY + dy));
      const dt = Math.max(8, event.timeStamp - grab.time);
      vx = vx * .35 + clamp((nextX - x) * 1000 / dt, 1700) * .65;
      vy = vy * .35 + clamp((nextY - y) * 1000 / dt, 1200) * .65;
      x = nextX;
      y = nextY;
      grab.time = event.timeStamp;
      paint();
    };

    const release = (event: PointerEvent) => {
      if (!grab || event.pointerId !== grab.id) return;
      const finished = grab;
      grab = undefined;
      suppressClick.current = finished.dragged || event.type !== "pointerup";
      if (finished.dragged) {
        const decay = Math.exp(-Math.max(0, event.timeStamp - finished.time) / 65);
        vx *= decay;
        vy *= decay;
      }
      delete button.dataset.dragging;
      if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
      resume();
    };

    button.addEventListener("pointerdown", down, { signal });
    button.addEventListener("pointermove", move, { signal });
    button.addEventListener("pointerup", release, { signal });
    button.addEventListener("pointercancel", release, { signal });
    button.addEventListener("lostpointercapture", release, { signal });
    reduced.addEventListener("change", motionChange, { signal });
    const size = new ResizeObserver(resize);
    if (mount.current) size.observe(mount.current);

    if (!reduced.matches && window.scrollY < 4) {
      x = -12;
      y = -hang - button.offsetHeight - 12;
      vx = 55;
      falling = true;
      resume();
    }
    paint();

    return () => {
      stop();
      events.abort();
      size.disconnect();
    };
  }, [mount]);

  return (
    <div className="badge-mount" ref={mount}>
      <svg className="badge-lanyard" width="1" height="1" aria-hidden="true">
        <path ref={strap} />
      </svg>
      <div className="badge-carriage" ref={carriage}>
        <span className="badge-clip" aria-hidden="true" />
        <button
          className="portrait-badge"
          ref={control}
          type="button"
          aria-label={flipped
            ? "Show portrait. Barsarani Sahoo, CSIT · REVA University, BBA DBE · IIM Bangalore"
            : "Flip Barsarani Sahoo’s portrait badge"}
          aria-pressed={flipped}
          onClick={event => {
            if (event.detail !== 0 && suppressClick.current) {
              suppressClick.current = false;
              return;
            }
            setUsed(true);
            setFlipped(value => !value);
          }}
        >
          <span className="badge-faces" aria-hidden="true">
            <span className="badge-face badge-face--front">
              <span className="badge-label"><b>BS</b><span>Bengaluru</span></span>
              <img src={import.meta.env.BASE_URL + portrait.src} alt="" width={portrait.width} height={portrait.height} draggable={false} />
            </span>
            <span className="badge-face badge-face--back">
              <b>Barsarani Sahoo</b>
              <span>CSIT · REVA University</span>
              <span>BBA DBE · IIM Bangalore</span>
            </span>
          </span>
        </button>
        <span className="badge-hint" data-used={used} aria-hidden="true">Drag or flip</span>
      </div>
    </div>
  );
}
