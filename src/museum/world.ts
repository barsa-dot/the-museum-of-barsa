// Describes a walkable space independently of how it is drawn: where the
// visitor starts, what is solid and what can be interacted with.

import type { SectionId } from "../data/profile/presentation";
import type { Collider } from "./collision";
import type { Interactable } from "./interaction";
import type { PlayerState } from "./movement";

/** What an exhibit's panel shows. Always rendered from verified profile data. */
export type ExhibitContent =
  | { type: "section"; section: SectionId }
  | { type: "education"; id: string }
  | { type: "project"; id: string }
  | { type: "experience"; id: string }
  | { type: "achievement"; id: string }
  | { type: "identity" }
  | { type: "notice"; title: string; text: string };

export interface Exhibit extends Interactable {
  content: ExhibitContent;
}

export interface World {
  name: string;
  start: PlayerState;
  colliders: readonly Collider[];
  exhibits: readonly Exhibit[];
}

export const PLAYER_RADIUS = 0.35;
