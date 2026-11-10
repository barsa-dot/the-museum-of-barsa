// The Grand Atrium, drawn from atriumLayout. A tall stone hall around a
// reflecting pool with a monolith lit from an oculus; a colonnade that keeps
// sightlines to every door clear; six arched doorways with signs; inlaid
// floor routes from the pool to each door. Corridors and rooms beyond the
// doorways are drawn by Rooms.tsx.
//
// Performance: simple primitives, one shared arch geometry, instanced
// columns, no real-time shadows. Lighting is a hemisphere fill, one
// directional key and one point light under the oculus.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DoubleSide, ExtrudeGeometry, Object3D, Shape, type InstancedMesh, type Texture } from "three";
import type { Mode } from "../../data/profile/presentation";
import { ROOMS, type RoomDef, type Side } from "../rooms";
import { ATRIUM, columnPositions, doorCentre, sideVectors } from "./atriumLayout";
import { loadSignFonts, makeSignTexture, SIGN_ASPECT } from "./sign";
import type { ScenePalette } from "./palette";
import { floorGeometry, useFloorMaterial } from "./floor";

const { half: HALF, height: H, wallThickness: T, doorWidth: DW, doorSpring: SPRING } = ATRIUM;
const ARCH_R = DW / 2;
const ARCH_TOP = SPRING + ARCH_R;
const PANEL_W = DW + 1.2; // wall panel that carries the arched opening

/** Rotation (about Y) that turns an XY-plane object to face into the atrium from a wall. */
const INWARD_YAW: Record<Side, number> = { north: 0, south: Math.PI, west: Math.PI / 2, east: -Math.PI / 2 };

function useArchPanelGeometry() {
  return useMemo(() => {
    const w = PANEL_W / 2;
    const shape = new Shape();
    shape.moveTo(-w, 0);
    shape.lineTo(-ARCH_R, 0);
    shape.lineTo(-ARCH_R, SPRING);
    shape.absarc(0, SPRING, ARCH_R, Math.PI, 0, true);
    shape.lineTo(ARCH_R, 0);
    shape.lineTo(w, 0);
    shape.lineTo(w, H);
    shape.lineTo(-w, H);
    shape.lineTo(-w, 0);
    const geometry = new ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 24 });
    geometry.translate(0, 0, -T / 2);
    return geometry;
  }, []);
}

/** Plain wall pieces along one side, leaving room for the arched panels. */
function wallSegments(side: Side): [number, number][] {
  const doors = ROOMS.filter((r) => r.side === side).map((r) => r.at).sort((a, b) => a - b);
  const segments: [number, number][] = [];
  let cursor = -HALF - T;
  for (const at of doors) {
    segments.push([cursor, at - PANEL_W / 2]);
    cursor = at + PANEL_W / 2;
  }
  segments.push([cursor, HALF + T]);
  return segments.filter(([a, b]) => b - a > 0.01);
}

function Walls({ palette }: { palette: ScenePalette }) {
  const arch = useArchPanelGeometry();
  const sides: Side[] = ["north", "south", "east", "west"];
  return (
    <group>
      {sides.flatMap((side) => {
        const { out } = sideVectors(side);
        const line = HALF + T / 2;
        return wallSegments(side).map(([a, b]) => {
          const m = (a + b) / 2;
          const len = b - a;
          const horizontal = side === "north" || side === "south";
          return (
            <mesh key={`${side}${a}`} position={horizontal ? [m, H / 2, out[1] * line] : [out[0] * line, H / 2, m]}>
              <boxGeometry args={horizontal ? [len, H, T] : [T, H, len]} />
              <meshStandardMaterial color={palette.wall} roughness={0.92} />
            </mesh>
          );
        });
      })}
      {ROOMS.map((room) => {
        const c = doorCentre(room);
        const { out } = sideVectors(room.side);
        return (
          <mesh
            key={room.id}
            geometry={arch}
            position={[c.x + (out[0] * T) / 2, 0, c.z + (out[1] * T) / 2]}
            rotation-y={room.side === "west" || room.side === "east" ? Math.PI / 2 : 0}
          >
            <meshStandardMaterial color={palette.wall} roughness={0.92} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Trim around an arched doorway, plus the room sign above it. */
function Doorway({ room, palette, sign }: { room: RoomDef; palette: ScenePalette; sign: Texture | null }) {
  const c = doorCentre(room);
  const { out } = sideVectors(room.side);
  const inset = -0.02; // just proud of the inner wall face
  const face = HALF + inset;
  const pos = (along: number, y: number, depth = 0): [number, number, number] => {
    const horizontal = room.side === "north" || room.side === "south";
    return horizontal ? [c.x + along, y, out[1] * (face - depth)] : [out[0] * (face - depth), y, c.z + along];
  };
  const yaw = INWARD_YAW[room.side];
  const signW = 3.4;
  return (
    <group>
      {/* Jambs and arch moulding. */}
      <group position={pos(0, 0, 0.06)} rotation-y={yaw}>
        <mesh position={[-ARCH_R - 0.09, SPRING / 2, 0]}>
          <boxGeometry args={[0.18, SPRING, 0.12]} />
          <meshStandardMaterial color={palette.trim} roughness={0.7} />
        </mesh>
        <mesh position={[ARCH_R + 0.09, SPRING / 2, 0]}>
          <boxGeometry args={[0.18, SPRING, 0.12]} />
          <meshStandardMaterial color={palette.trim} roughness={0.7} />
        </mesh>
        <mesh position={[0, SPRING, 0]}>
          <torusGeometry args={[ARCH_R + 0.09, 0.09, 6, 32, Math.PI]} />
          <meshStandardMaterial color={palette.trim} roughness={0.7} />
        </mesh>
      </group>
      {/* Sign above the arch. */}
      {sign && (
        <mesh position={pos(0, ARCH_TOP + 0.95, 0.04)} rotation-y={yaw}>
          <planeGeometry args={[signW, signW / SIGN_ASPECT]} />
          <meshBasicMaterial map={sign} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function Colonnade({ palette }: { palette: ScenePalette }) {
  const ref = useRef<InstancedMesh>(null);
  const columns = useMemo(columnPositions, []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    columns.forEach((c, i) => {
      o.position.set(c.x, H / 2, c.z);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [columns]);
  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, columns.length]}>
        <cylinderGeometry args={[ATRIUM.columnRadius, ATRIUM.columnRadius * 1.15, H, 20]} />
        <meshStandardMaterial color={palette.trim} roughness={0.6} />
      </instancedMesh>
      {palette.style.columns === "classical" ? (
        <>
          {/* Square plinth and capital on every column. */}
          <ColumnDetail heights={[0.2]} size={[ATRIUM.columnRadius * 3.2, 0.4]} color={palette.trim} glow={false} box />
          <ColumnDetail heights={[H - 0.25]} size={[ATRIUM.columnRadius * 3, 0.5]} color={palette.trim} glow={false} box />
        </>
      ) : (
        /* Lit rings, like segments of a status bar. */
        <ColumnDetail heights={[1.4, 1.55, H - 1.6]} size={[ATRIUM.columnRadius * 1.12, 0.05]} color={palette.glow} glow box={false} />
      )}
    </group>
  );
}

/** Instanced details placed on every column at the given heights. */
function ColumnDetail({ heights, size, color, glow, box }: { heights: number[]; size: [number, number]; color: string; glow: boolean; box: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  const columns = useMemo(columnPositions, []);
  const count = columns.length * heights.length;
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    let i = 0;
    for (const c of columns) {
      for (const h of heights) {
        o.position.set(c.x, h, c.z);
        o.updateMatrix();
        mesh.setMatrixAt(i++, o.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [columns, heights]);
  const [w, h] = size;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      {box ? <boxGeometry args={[w, h, w]} /> : <cylinderGeometry args={[w, w, h, 20]} />}
      {glow ? <meshBasicMaterial color={color} toneMapped={false} /> : <meshStandardMaterial color={color} roughness={0.55} />}
    </instancedMesh>
  );
}

/** Pool, monolith and the oculus above: the hall's focal point. */
function Centrepiece({ palette }: { palette: ScenePalette }) {
  const { radius, rim } = ATRIUM.pool;
  return (
    <group>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[radius + rim, radius + rim, 0.4, 48]} />
        <meshStandardMaterial color={palette.trim} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.41, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial color={palette.water} roughness={0.08} metalness={0.6} />
      </mesh>
      {/* Monolith with a lit seam on each face. */}
      <mesh position={[0, 3.2, 0]}>
        <boxGeometry args={[ATRIUM.monolithHalf * 2, 5.6, ATRIUM.monolithHalf * 2]} />
        <meshStandardMaterial color={palette.trim} roughness={0.35} metalness={0.2} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.sin((i * Math.PI) / 2) * 0.505, 3.2, Math.cos((i * Math.PI) / 2) * 0.505]} rotation-y={(i * Math.PI) / 2}>
          <planeGeometry args={[0.06, 5.2]} />
          <meshBasicMaterial color={palette.glow} toneMapped={false} />
        </mesh>
      ))}
      {/* Oculus. */}
      <mesh position={[0, H - 0.01, 0]} rotation-x={Math.PI / 2}>
        <circleGeometry args={[2.4, 48]} />
        <meshBasicMaterial color={palette.glow} toneMapped={false} />
      </mesh>
      <mesh position={[0, H - 0.02, 0]} rotation-x={Math.PI / 2}>
        <ringGeometry args={[2.4, 2.75, 48]} />
        <meshStandardMaterial color={palette.trim} side={DoubleSide} />
      </mesh>
      <pointLight position={[0, H - 1.2, 0]} intensity={60} distance={22} decay={1.6} color={palette.glow} />
    </group>
  );
}

/** Floor with an inlaid ring around the pool and a route to every door. */
function Floor({ palette }: { palette: ScenePalette }) {
  const ringInner = ATRIUM.pool.radius + ATRIUM.pool.rim + 1;
  const material = useFloorMaterial(palette);
  const geometry = useMemo(() => floorGeometry(HALF * 2, HALF * 2), []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} geometry={geometry} material={material} />
      <mesh position={[0, 0.01, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[ringInner, ringInner + 0.14, 64]} />
        <meshBasicMaterial color={palette.signMuted} toneMapped={false} />
      </mesh>
      {ROOMS.map((room) => {
        const d = doorCentre(room);
        const angle = Math.atan2(d.z, d.x);
        const start = ringInner + 0.14;
        const len = Math.hypot(d.x, d.z) - start;
        const mid = start + len / 2;
        return (
          <mesh key={room.id} position={[Math.cos(angle) * mid, 0.01, Math.sin(angle) * mid]} rotation={[-Math.PI / 2, 0, -angle]}>
            <planeGeometry args={[len, 0.1]} />
            <meshBasicMaterial color={palette.signMuted} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

function Ceiling({ palette }: { palette: ScenePalette }) {
  return (
    <group>
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[HALF * 2, HALF * 2]} />
        <meshStandardMaterial color={palette.wall} roughness={1} side={DoubleSide} />
      </mesh>
      {/* Clerestory band of light around the top of the walls. */}
      {(["north", "south", "east", "west"] as Side[]).map((side) => {
        const { out } = sideVectors(side);
        const horizontal = side === "north" || side === "south";
        const p: [number, number, number] = horizontal ? [0, H - 1.1, out[1] * (HALF - 0.03)] : [out[0] * (HALF - 0.03), H - 1.1, 0];
        return (
          <mesh key={side} position={p} rotation-y={INWARD_YAW[side]}>
            <planeGeometry args={[HALF * 2, 0.35]} />
            <meshBasicMaterial color={palette.glow} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

function useSigns(mode: Mode, palette: ScenePalette) {
  const [signs, setSigns] = useState<Map<string, Texture> | null>(null);
  useEffect(() => {
    let cancelled = false;
    let made: Texture[] = [];
    loadSignFonts(mode).then(() => {
      if (cancelled) return;
      const map = new Map(ROOMS.map((r) => [r.id, makeSignTexture(r.name, r.theme, mode, palette)]));
      made = [...map.values()];
      setSigns(map);
    });
    return () => {
      cancelled = true;
      made.forEach((t) => t.dispose());
    };
  }, [mode, palette]);
  return signs;
}

export function Atrium({ mode, palette }: { mode: Mode; palette: ScenePalette }) {
  const signs = useSigns(mode, palette);
  return (
    <group>
      <hemisphereLight args={[palette.sky, palette.ground, palette.fill]} />
      <directionalLight position={[8, 14, 6]} intensity={0.9} />
      <Floor palette={palette} />
      <Walls palette={palette} />
      <Ceiling palette={palette} />
      <Colonnade palette={palette} />
      <Centrepiece palette={palette} />
      {ROOMS.map((room) => (
        <group key={room.id}>
          <Doorway room={room} palette={palette} sign={signs?.get(room.id) ?? null} />
        </group>
      ))}
    </group>
  );
}
