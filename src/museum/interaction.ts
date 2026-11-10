// Proximity interaction: which exhibit or entrance (if any) the visitor is
// close to AND facing. Pure maths, independent of rendering.

import type { PlayerState } from "./movement";

export interface Interactable {
  id: string;
  /** Short name shown in the prompt, e.g. "Education". */
  label: string;
  /** What activating does, shown in the prompt: "View", "Enter", … */
  verb: string;
  x: number;
  z: number;
  /** Distance (m) within which the prompt appears. */
  radius: number;
}

/** Visitors must roughly face an item (within this angle) for its prompt. */
export const FACING_LIMIT = (65 * Math.PI) / 180;

/** Angle between the visitor's facing direction and the item, in radians. */
export function angleTo(player: PlayerState, item: { x: number; z: number }): number {
  const fx = -Math.sin(player.yaw);
  const fz = -Math.cos(player.yaw);
  const dx = item.x - player.x;
  const dz = item.z - player.z;
  const dist = Math.hypot(dx, dz);
  if (dist === 0) return 0;
  return Math.acos(Math.max(-1, Math.min(1, (fx * dx + fz * dz) / dist)));
}

/** The closest item the visitor is near and facing, or null. */
export function nearestInteractable<T extends Interactable>(player: PlayerState, items: readonly T[]): T | null {
  let best: T | null = null;
  let bestDist = Infinity;
  for (const item of items) {
    const dist = Math.hypot(item.x - player.x, item.z - player.z);
    if (dist > item.radius || dist >= bestDist) continue;
    if (dist > 0.5 && angleTo(player, item) > FACING_LIMIT) continue;
    best = item;
    bestDist = dist;
  }
  return best;
}
