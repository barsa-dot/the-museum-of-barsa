// Touch controls maths: virtual joystick and drag-to-look.

import type { MoveInput } from "./movement";

/** Fraction of the pad radius treated as "no input", so a resting thumb doesn't drift. */
export const JOYSTICK_DEADZONE = 0.15;
/** Touch drags turn a little faster than mouse movement, to suit small screens. */
export const TOUCH_LOOK_SCALE = 1.6;

/**
 * Converts the thumb's offset from the pad centre into movement.
 * Dragging up walks forward, sideways strafes. The knob offset is clamped to
 * the pad radius; input ramps from 0 at the dead zone to 1 at the rim.
 */
export function joystickInput(dx: number, dy: number, radius: number, deadzone = JOYSTICK_DEADZONE): MoveInput {
  const distance = Math.hypot(dx, dy);
  if (radius <= 0 || distance <= radius * deadzone) return { forward: 0, strafe: 0, turn: 0 };
  const clamped = Math.min(distance, radius);
  const strength = (clamped - radius * deadzone) / (radius * (1 - deadzone));
  const ux = dx / distance;
  const uy = dy / distance;
  return { forward: -uy * strength, strafe: ux * strength, turn: 0 };
}

/** Where to draw the knob: the thumb position, clamped to the pad. */
export function knobOffset(dx: number, dy: number, radius: number): { x: number; y: number } {
  const distance = Math.hypot(dx, dy);
  if (distance <= radius || distance === 0) return { x: dx, y: dy };
  return { x: (dx / distance) * radius, y: (dy / distance) * radius };
}

/** Whether to offer touch controls on this device. */
export function prefersTouch(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(pointer: coarse)").matches || (navigator.maxTouchPoints ?? 0) > 0;
}
