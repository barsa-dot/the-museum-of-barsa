// Quick navigation: where "Go to …" places the visitor, and the recruiter
// shortcuts that open content without walking. The map is a supporting tool;
// walking stays the main way to explore.

import type { ModeView } from "../data/profile/selectors";
import type { PlayerState } from "./movement";
import { ROOMS } from "./rooms";
import { ATRIUM_START, throughDoor, yawFacing } from "./scene/atriumLayout";
import type { ExhibitContent } from "./world";
import { resumeHref } from "../content/rules";

export interface Destination {
  id: string;
  name: string;
  theme: string;
  /** Just inside the room's doorway, facing into the room. */
  spot: PlayerState;
}

export const ATRIUM_DESTINATION: Destination = { id: "atrium", name: "Grand Atrium", theme: "Central hall", spot: ATRIUM_START };

export const ROOM_DESTINATIONS: readonly Destination[] = ROOMS.map((room) => {
  // The atrium wall is at 14 m from the centre and rooms start at 22 m, so
  // 9 m through the doorway is 1 m inside the room.
  const p = throughDoor(room, 9);
  return { id: room.id, name: room.name, theme: room.theme, spot: { x: p.x, z: p.z, yaw: yawFacing(room.side), pitch: 0 } };
});

export type Shortcut =
  | { id: string; label: string; kind: "panel"; content: ExhibitContent }
  | { id: string; label: string; kind: "link"; href: string }
  | { id: string; label: string; kind: "unavailable"; note: string };

/**
 * Shortcuts to every section's content, so the whole museum can be read
 * without walking (recruiters, keyboard-only and screen-reader visitors).
 * Built from the verified view; nothing links to a missing file.
 */
export function recruiterShortcuts(view: ModeView): Shortcut[] {
  const resume = resumeHref(view.contact?.resume);
  return [
    { id: "projects", label: "Projects", kind: "panel", content: { type: "section", section: "projects" } },
    { id: "education", label: "Education", kind: "panel", content: { type: "section", section: "education" } },
    // Shown once there is something to read; the Library holds them in the museum.
    ...(view.achievements.length > 0
      ? [{ id: "achievements", label: "Achievements", kind: "panel", content: { type: "section", section: "achievements" } } as const]
      : []),
    { id: "experience", label: "Experience", kind: "panel", content: { type: "section", section: "experience" } },
    { id: "skills", label: "Skills", kind: "panel", content: { type: "section", section: "skills" } },
    { id: "about", label: "About", kind: "panel", content: { type: "section", section: "about" } },
    { id: "contact", label: "Contact", kind: "panel", content: { type: "section", section: "contact" } },
    resume
      ? { id: "resume", label: "Resume (PDF)", kind: "link", href: resume }
      : { id: "resume", label: "Resume", kind: "unavailable", note: "Not yet available" },
  ];
}
