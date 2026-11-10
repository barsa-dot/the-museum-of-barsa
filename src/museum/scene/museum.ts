// The complete walkable museum for one mode: walls, furnishings and the
// exhibits built from that mode's verified profile view.

import type { ModeView } from "../../data/profile/selectors";
import type { Collider } from "../collision";
import type { World } from "../world";
import { ATRIUM_START } from "./atriumLayout";
import { buildExhibits, type ExhibitSpec } from "./exhibits";
import { FURNISHING_COLLIDERS } from "./furnishings";
import { MUSEUM_COLLIDERS } from "./plan";

export interface MuseumWorld extends World {
  specs: readonly ExhibitSpec[];
}

export function buildMuseumWorld(view: ModeView): MuseumWorld {
  const specs = buildExhibits(view);
  return {
    name: "Grand Atrium",
    start: ATRIUM_START,
    colliders: [
      ...MUSEUM_COLLIDERS,
      ...FURNISHING_COLLIDERS,
      ...specs.map((s) => s.collider).filter((c): c is Collider => c !== null),
    ],
    exhibits: specs.flatMap((s) => (s.exhibit ? [s.exhibit] : [])),
    specs,
  };
}
