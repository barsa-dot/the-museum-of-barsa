// On-screen touch controls: a joystick pad (bottom-left) for walking and
// drag-anywhere-else to look. Each finger is tracked by pointerId, so walking
// and looking work at the same time.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import type { InputState } from "./input";
import { TOUCH_LOOK_SCALE, joystickInput, knobOffset } from "./touch";

const PAD_RADIUS = 56; // px, half the visual pad size minus the knob

export function Joystick({ input }: { input: InputState }) {
  const padRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const update = (event: ReactPointerEvent) => {
    const pad = padRef.current;
    if (!pad) return;
    const box = pad.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    input.joystick = joystickInput(dx, dy, PAD_RADIUS);
    setKnob(knobOffset(dx, dy, PAD_RADIUS));
  };

  const release = () => {
    pointer.current = null;
    input.joystick = { forward: 0, strafe: 0, turn: 0 };
    setKnob({ x: 0, y: 0 });
  };

  useEffect(() => release, []); // stop moving if unmounted mid-drag

  return (
    <div
      ref={padRef}
      className="museum-joystick"
      role="group"
      aria-label="Movement pad. Drag to walk."
      onPointerDown={(event) => {
        if (pointer.current !== null) return;
        pointer.current = event.pointerId;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        event.stopPropagation();
        update(event);
      }}
      onPointerMove={(event) => {
        if (event.pointerId === pointer.current) update(event);
      }}
      onPointerUp={(event) => {
        if (event.pointerId === pointer.current) release();
      }}
      onPointerCancel={(event) => {
        if (event.pointerId === pointer.current) release();
      }}
    >
      <span className="museum-joystick__knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}

/** Drag-to-look on the stage for touch and pen pointers (mouse uses pointer lock). */
export function useTouchLook(stageRef: RefObject<HTMLElement | null>, input: InputState): void {
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const last = new Map<number, { x: number; y: number }>();
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      last.set(e.pointerId, { x: e.clientX, y: e.clientY });
    };
    const move = (e: PointerEvent) => {
      const prev = last.get(e.pointerId);
      if (!prev || !input.enabled) return;
      input.lookDx += (e.clientX - prev.x) * TOUCH_LOOK_SCALE;
      input.lookDy += (e.clientY - prev.y) * TOUCH_LOOK_SCALE;
      last.set(e.pointerId, { x: e.clientX, y: e.clientY });
    };
    const up = (e: PointerEvent) => void last.delete(e.pointerId);
    stage.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      stage.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [stageRef, input]);
}
