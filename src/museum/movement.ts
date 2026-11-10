// First-person movement maths, independent of Three.js and the DOM so it can
// be unit-tested exactly. Units: metres, seconds, radians.
//
// Conventions: the camera looks down -Z when yaw = 0. Yaw increases when
// turning left (counter-clockwise seen from above), matching Three.js.

export const EYE_HEIGHT = 1.6;
export const WALK_SPEED = 3.2; // m/s, a relaxed walking pace
export const TURN_SPEED = 1.9; // rad/s for keyboard turning
export const LOOK_SENSITIVITY = 0.0022; // rad per pixel of mouse movement
export const MAX_PITCH = (80 * Math.PI) / 180;

export interface PlayerState {
  x: number;
  z: number;
  yaw: number;
  pitch: number;
}

/** Movement intent: -1..1 on each axis (analogue for joysticks). */
export interface MoveInput {
  /** +1 forward, -1 back. */
  forward: number;
  /** +1 right, -1 left. */
  strafe: number;
  /** +1 turn left, -1 turn right. */
  turn: number;
}

export type Action = "forward" | "back" | "left" | "right" | "turnLeft" | "turnRight";

/**
 * Keyboard mapping. WASD walks and strafes; arrow keys walk and TURN, so
 * keyboard-only visitors can look around without a mouse.
 */
const KEY_ACTIONS: Record<string, Action> = {
  KeyW: "forward",
  KeyS: "back",
  KeyA: "left",
  KeyD: "right",
  ArrowUp: "forward",
  ArrowDown: "back",
  ArrowLeft: "turnLeft",
  ArrowRight: "turnRight",
};

export function actionForKey(code: string): Action | null {
  return KEY_ACTIONS[code] ?? null;
}

export function inputFromActions(active: ReadonlySet<Action>): MoveInput {
  const axis = (pos: Action, neg: Action) => (active.has(pos) ? 1 : 0) - (active.has(neg) ? 1 : 0);
  return {
    forward: axis("forward", "back"),
    strafe: axis("right", "left"),
    turn: axis("turnLeft", "turnRight"),
  };
}

/** Combine several inputs (keyboard + joystick), clamping each axis to -1..1. */
export function combineInputs(...inputs: MoveInput[]): MoveInput {
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  return {
    forward: clamp(inputs.reduce((s, i) => s + i.forward, 0)),
    strafe: clamp(inputs.reduce((s, i) => s + i.strafe, 0)),
    turn: clamp(inputs.reduce((s, i) => s + i.turn, 0)),
  };
}

/**
 * Advance the player by `dt` seconds. Diagonal movement is normalised so it
 * is never faster than straight movement. Returns a new state.
 */
export function stepPlayer(state: PlayerState, input: MoveInput, dt: number, speed = WALK_SPEED): PlayerState {
  const yaw = state.yaw + input.turn * TURN_SPEED * dt;
  let f = input.forward;
  let s = input.strafe;
  const length = Math.hypot(f, s);
  if (length > 1) {
    f /= length;
    s /= length;
  }
  // Forward is -Z rotated by yaw; right is +X rotated by yaw.
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);
  const dx = (-sin * f + cos * s) * speed * dt;
  const dz = (-cos * f - sin * s) * speed * dt;
  return { x: state.x + dx, z: state.z + dz, yaw, pitch: state.pitch };
}

/** Apply a mouse/touch look delta in pixels. Pitch is clamped so the view never flips. */
export function applyLook(state: PlayerState, dxPixels: number, dyPixels: number, sensitivity = LOOK_SENSITIVITY): PlayerState {
  const pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, state.pitch - dyPixels * sensitivity));
  return { ...state, yaw: state.yaw - dxPixels * sensitivity, pitch };
}

/** Large frame gaps (tab switches, slow devices) must not teleport the player. */
export function clampDelta(dt: number): number {
  return Math.min(Math.max(dt, 0), 0.1);
}
