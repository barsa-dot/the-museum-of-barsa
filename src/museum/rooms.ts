// The museum's rooms and where their entrances open off the Grand Atrium.
// One list, used by the atrium geometry, its signs, collisions, prompts and
// (later) the map.

import type { SectionId } from "../data/profile/presentation";

export type Side = "north" | "south" | "east" | "west";

export interface RoomDef {
  id: string;
  name: string;
  /** What the room holds, shown under its name on signs. */
  theme: string;
  section: SectionId;
  /** Which atrium wall the entrance is in, and its position along that wall. */
  side: Side;
  at: number;
}

export const ROOMS: readonly RoomDef[] = [
  { id: "creation", name: "The Creation Wing", theme: "Projects", section: "projects", side: "north", at: 0 },
  { id: "library", name: "The Library", theme: "Education", section: "education", side: "west", at: -5 },
  { id: "archive", name: "The Archive", theme: "Experience", section: "experience", side: "west", at: 5 },
  { id: "workshop", name: "The Workshop", theme: "Skills", section: "skills", side: "east", at: -5 },
  { id: "portrait", name: "The Portrait Room", theme: "About", section: "about", side: "east", at: 5 },
  { id: "courtyard", name: "The Courtyard", theme: "Contact", section: "contact", side: "south", at: 0 },
];
