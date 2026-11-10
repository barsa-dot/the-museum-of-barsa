// Corridors, galleries, room shells and the open-air Courtyard, drawn from
// plan.ts. Walls, ceilings, lights and trims are each one instanced mesh (a
// single draw call per kind), so adding rooms costs very little.
//
// Mode-aware architecture: Developer draws each room as a lit "wireframe"
// (glowing baseboard and crown line, grid floor); Business as a classical
// gallery (dark skirting, dado and picture rails, stone floor).

import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { DoubleSide, Object3D, type InstancedMesh } from "three";
import { CORRIDOR_WALL_PIECES, CORRIDORS, ROOM_PLANS, ROOM_WALL_PIECES, type Rect, type WallPiece } from "./plan";
import type { ScenePalette } from "./palette";
import { floorGeometry, useFloorMaterial } from "./floor";

interface Slab {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
}

const slabOf = (r: Rect, y: number, inset = 0): Slab => ({
  x: (r.minX + r.maxX) / 2,
  y,
  z: (r.minZ + r.maxZ) / 2,
  w: r.maxX - r.minX - inset * 2,
  d: r.maxZ - r.minZ - inset * 2,
});

/** One instanced box mesh for many axis-aligned wall pieces. */
function WallBatch({ pieces, children }: { pieces: readonly WallPiece[]; children: ReactNode }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    pieces.forEach((p, i) => {
      o.position.set(p.x, p.y + p.h / 2, p.z);
      o.scale.set(p.w, p.h, p.d);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [pieces]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pieces.length]}>
      <boxGeometry args={[1, 1, 1]} />
      {children}
    </instancedMesh>
  );
}

/** One instanced horizontal plane mesh (floors, ceilings, light panels). */
function SlabBatch({ slabs, facing, children }: { slabs: readonly Slab[]; facing: "up" | "down"; children: ReactNode }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    slabs.forEach((s, i) => {
      o.position.set(s.x, s.y, s.z);
      o.rotation.set(facing === "up" ? -Math.PI / 2 : Math.PI / 2, 0, 0);
      o.scale.set(s.w, s.d, 1);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [slabs, facing]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, slabs.length]}>
      <planeGeometry args={[1, 1]} />
      {children}
    </instancedMesh>
  );
}

const INDOOR_ROOMS = ROOM_PLANS.filter((r) => !r.open);
const OUTDOOR = ROOM_PLANS.filter((r) => r.open);
const INDOOR_CORRIDORS = CORRIDORS.filter((c) => !c.open);
const ALL_WALLS = [...ROOM_WALL_PIECES, ...CORRIDOR_WALL_PIECES];
/** A thin band wrapping the foot of every standing wall piece. */
const BASEBOARDS: WallPiece[] = ALL_WALLS.filter((p) => p.y === 0).map((p) => ({ ...p, w: p.w + 0.04, d: p.d + 0.04, h: 0.1 }));
const FLOORS = [...INDOOR_ROOMS.map((r) => slabOf(r.rect, 0.002)), ...CORRIDORS.map((c) => slabOf(c.rect, 0.003))];
const STANDING = ALL_WALLS.filter((p) => p.y === 0);
/** Business: a dado rail (below the framed exhibits) and a picture rail at 3.3 m. */
const RAILS: WallPiece[] = STANDING.flatMap((p) => [
  { ...p, y: 0.75, h: 0.07, w: p.w + 0.05, d: p.d + 0.05 },
  ...(p.h > 3.6 ? [{ ...p, y: 3.3, h: 0.05, w: p.w + 0.04, d: p.d + 0.04 }] : []),
]);
/** Developer: a lit line along the top of every wall. */
const CROWNS: WallPiece[] = STANDING.map((p) => ({ ...p, y: p.h - 0.07, h: 0.05, w: p.w + 0.04, d: p.d + 0.04 }));
const CEILINGS = [...INDOOR_ROOMS.map((r) => slabOf(r.rect, r.wallHeight)), ...INDOOR_CORRIDORS.map((c) => slabOf(c.rect, c.height))];
const LIGHTS = [
  ...INDOOR_ROOMS.map((r) => slabOf(r.rect, r.wallHeight - 0.01, Math.min(r.rect.maxX - r.rect.minX, r.rect.maxZ - r.rect.minZ) * 0.3)),
  ...INDOOR_CORRIDORS.map((c) => {
    const s = slabOf(c.rect, c.height - 0.01);
    return c.axis === "x" ? { ...s, d: 0.4 } : { ...s, w: 0.4 };
  }),
];

/** Floors with a pattern that stays the same physical size in every space. */
function Floors({ palette }: { palette: ScenePalette }) {
  const material = useFloorMaterial(palette);
  const floors = useMemo(() => FLOORS.map((slab) => ({ slab, geometry: floorGeometry(slab.w, slab.d) })), []);
  return (
    <group>
      {floors.map(({ slab, geometry }, i) => (
        <mesh key={i} geometry={geometry} material={material} position={[slab.x, slab.y, slab.z]} rotation-x={-Math.PI / 2} />
      ))}
    </group>
  );
}

export function Rooms({ palette }: { palette: ScenePalette }) {
  return (
    <group>
      <WallBatch pieces={ALL_WALLS}>
        <meshStandardMaterial color={palette.wall} roughness={0.92} />
      </WallBatch>
      <WallBatch pieces={BASEBOARDS}>
        <meshBasicMaterial color={palette.baseboard} toneMapped={false} />
      </WallBatch>
      {palette.style.walls === "rails" ? (
        <WallBatch pieces={RAILS}>
          <meshStandardMaterial color={palette.trim} roughness={0.5} />
        </WallBatch>
      ) : (
        <WallBatch pieces={CROWNS}>
          <meshBasicMaterial color={palette.baseboard} toneMapped={false} />
        </WallBatch>
      )}
      <Floors palette={palette} />
      <SlabBatch slabs={CEILINGS} facing="down">
        <meshStandardMaterial color={palette.wall} roughness={1} side={DoubleSide} />
      </SlabBatch>
      <SlabBatch slabs={LIGHTS} facing="down">
        <meshBasicMaterial color={palette.glow} toneMapped={false} side={DoubleSide} />
      </SlabBatch>

      {/* Open-air courtyard: paved floor, no ceiling. */}
      {OUTDOOR.map((r) => {
        const s = slabOf(r.rect, 0.002);
        return (
          <mesh key={r.room.id} position={[s.x, s.y, s.z]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[s.w, s.d]} />
            <meshStandardMaterial color={palette.ground} roughness={0.95} />
          </mesh>
        );
      })}

      {/* One soft ceiling light per indoor room (no shadows, to stay cheap). */}
      {INDOOR_ROOMS.map((r) => (
        <pointLight
          key={r.room.id}
          position={[(r.rect.minX + r.rect.maxX) / 2, r.wallHeight - 1.2, (r.rect.minZ + r.rect.maxZ) / 2]}
          intensity={palette.roomLight}
          distance={20}
          decay={1.5}
          color={palette.glow}
        />
      ))}

    </group>
  );
}
