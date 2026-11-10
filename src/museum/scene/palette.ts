// Scene colours derived from the mode's design tokens, so the 3D museum
// matches the rest of the site in each mode.

import { modeTokens } from "../../design/tokens";
import type { Mode } from "../../data/profile/presentation";

export interface ScenePalette {
  background: string;
  fog: string;
  floor: string;
  wall: string;
  trim: string;
  accent: string;
  text: string;
  sky: string;
  ground: string;
  /** Reflecting pool surface. */
  water: string;
  /** Light-emitting details (oculus, clerestory, accents). */
  glow: string;
  /** Sign panel background and text. */
  signBg: string;
  signText: string;
  signMuted: string;
  /** Overall fill (hemisphere) strength. */
  fill: number;
  /** Each room's ceiling light strength. */
  roomLight: number;
  /** Line along the foot of every wall: glows in Developer, dark skirting in Business. */
  baseboard: string;
  /** Courtyard tree crowns. */
  tree: string;
  /**
   * Architectural treatment, so the modes differ in more than colour:
   * Developer is a terminal "wireframe", Business a classical gallery.
   */
  style: {
    floor: "grid" | "tiles";
    walls: "crown" | "rails";
    columns: "rings" | "classical";
    frames: "bezel" | "mat";
  };
  /** Lines in the floor pattern. */
  floorLine: string;
  /** Mat (passe-partout) around framed exhibits in Business Mode. */
  mat: string;
}

export function scenePalette(mode: Mode): ScenePalette {
  const c = modeTokens[mode].color;
  return mode === "developer"
    ? {
        background: c.bg,
        fog: c.bg,
        floor: c.surface,
        // A touch lighter than the UI surface so room walls read in 3D.
        wall: "#1A2A21",
        trim: c.borderStrong,
        accent: c.accent,
        text: c.heading,
        sky: "#9FD9B8",
        ground: c.bg,
        water: "#06261A",
        glow: c.heading,
        signBg: c.bg,
        signText: c.heading,
        signMuted: c.accent,
        fill: 1.6,
        roomLight: 80,
        baseboard: c.accent,
        tree: c.accentMuted,
        style: { floor: "grid", walls: "crown", columns: "rings", frames: "bezel" },
        floorLine: c.accentMuted,
        mat: c.bg,
      }
    : {
        background: c.bg,
        fog: c.bg,
        floor: "#E6D9C2",
        wall: c.surface,
        trim: c.frame,
        accent: c.accent,
        text: c.heading,
        sky: "#FFF6E8",
        ground: "#B9A88C",
        water: "#7C8C88",
        glow: "#FFF3DC",
        signBg: c.surfaceRaised,
        signText: c.heading,
        signMuted: c.accent,
        fill: 1,
        roomLight: 30,
        baseboard: c.frame,
        tree: "#7E8C6F",
        style: { floor: "tiles", walls: "rails", columns: "classical", frames: "mat" },
        floorLine: "#CDBEA3",
        mat: c.surfaceRaised,
      };
}
