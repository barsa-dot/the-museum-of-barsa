// Input state shared between the DOM (keyboard, mouse, touch) and the render
// loop. Plain mutable object, not React state: it changes every frame.

import { actionForKey, inputFromActions, combineInputs, type Action, type MoveInput } from "./movement";

export interface InputState {
  actions: Set<Action>;
  /** Analogue movement from the touch joystick (3.2). */
  joystick: MoveInput;
  /** Look movement in pixels, accumulated until the next frame consumes it. */
  lookDx: number;
  lookDy: number;
  /** When false (e.g. a dialog is open), keys are ignored and movement stops. */
  enabled: boolean;
}

export function createInputState(): InputState {
  return { actions: new Set(), joystick: { forward: 0, strafe: 0, turn: 0 }, lookDx: 0, lookDy: 0, enabled: true };
}

export function currentMove(input: InputState): MoveInput {
  if (!input.enabled) return { forward: 0, strafe: 0, turn: 0 };
  return combineInputs(inputFromActions(input.actions), input.joystick);
}

/** Takes the accumulated look delta and resets it. */
export function consumeLook(input: InputState): { dx: number; dy: number } {
  const look = { dx: input.lookDx, dy: input.lookDy };
  input.lookDx = 0;
  input.lookDy = 0;
  return look;
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as { tagName?: string; isContentEditable?: boolean } | null;
  return Boolean(el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName ?? "")));
}

/**
 * Keyboard and pointer-lock mouse listeners. Returns a cleanup function.
 * Movement keys are captured (no page scrolling) except while typing.
 */
export function attachDesktopInput(input: InputState, canvas: () => HTMLElement | null): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (!input.enabled || event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return;
    const action = actionForKey(event.code);
    if (!action) return;
    event.preventDefault();
    input.actions.add(action);
  };
  const onKeyUp = (event: KeyboardEvent) => {
    const action = actionForKey(event.code);
    if (action) input.actions.delete(action);
  };
  const release = () => input.actions.clear();
  const onMouseMove = (event: MouseEvent) => {
    if (!input.enabled || document.pointerLockElement !== canvas()) return;
    input.lookDx += event.movementX;
    input.lookDy += event.movementY;
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", release);
  document.addEventListener("visibilitychange", release);
  document.addEventListener("mousemove", onMouseMove);
  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", release);
    document.removeEventListener("visibilitychange", release);
    document.removeEventListener("mousemove", onMouseMove);
  };
}
