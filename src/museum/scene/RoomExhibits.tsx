// Draws the room exhibits (from exhibits.ts) and furnishings (from
// furnishings.ts). Exhibit faces are canvas textures in the mode's fonts;
// the portrait is the owner's real image (pixel art in Developer Mode,
// photograph in Business Mode). Repeated furniture is instanced.

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { NearestFilter, Object3D, SRGBColorSpace, TextureLoader, type InstancedMesh, type Texture } from "three";
import { profile } from "../../data/profile";
import type { Mode } from "../../data/profile/presentation";
import type { ExhibitSpec } from "./exhibits";
import { FURNISHINGS, type Furnishing, type FurnishingKind } from "./furnishings";
import { loadSignFonts, makePlaqueTexture } from "./sign";
import type { ScenePalette } from "./palette";

/** Face sizes (width × height, metres) per exhibit kind. */
const FACE_SIZE: Record<ExhibitSpec["kind"], [number, number]> = {
  wallPlaque: [2.4, 1.5],
  stand: [2.1, 1.25],
  sealedDoor: [2.2, 0.75],
  portrait: [1.8, 0.5],
  noticeBoard: [2.2, 1.4],
  signpost: [1.7, 1.05],
};

function usePlaqueTextures(specs: readonly ExhibitSpec[], mode: Mode, palette: ScenePalette) {
  const [textures, setTextures] = useState<Map<string, Texture>>(new Map());
  useEffect(() => {
    let cancelled = false;
    let made: Texture[] = [];
    loadSignFonts(mode).then(() => {
      if (cancelled) return;
      const map = new Map(
        specs.map((s) => {
          const [w, h] = FACE_SIZE[s.kind];
          return [s.id, makePlaqueTexture(s.plaque, mode, palette, w / h)] as const;
        }),
      );
      made = [...map.values()];
      setTextures(map);
    });
    return () => {
      cancelled = true;
      made.forEach((t) => t.dispose());
    };
  }, [specs, mode, palette]);
  return textures;
}

/** The owner's portrait as a texture: crisp pixels in Developer Mode. */
function usePortraitTexture(mode: Mode): Texture | null {
  const [texture, setTexture] = useState<Texture | null>(null);
  useEffect(() => {
    const image = mode === "developer" ? profile.portrait.pixel : profile.portrait.photo;
    if (!image) return;
    let cancelled = false;
    let loaded: Texture | null = null;
    new TextureLoader().load(`/${image.src}`, (t) => {
      if (cancelled) return t.dispose();
      t.colorSpace = SRGBColorSpace;
      if (mode === "developer") {
        t.magFilter = NearestFilter;
        t.minFilter = NearestFilter;
        t.generateMipmaps = false;
      }
      loaded = t;
      setTexture(t);
    });
    return () => {
      cancelled = true;
      loaded?.dispose();
    };
  }, [mode]);
  return texture;
}

function Face({ texture, w, h }: { texture: Texture | undefined; w: number; h: number }) {
  return (
    <mesh>
      <planeGeometry args={[w, h]} />
      {/* key: a material created without a map never shows one added later (its shader is
          already compiled), so the material is recreated when the texture arrives. */}
      {texture ? <meshBasicMaterial key={texture.uuid} map={texture} toneMapped={false} /> : <meshBasicMaterial key="empty" color="#000" transparent opacity={0} />}
    </mesh>
  );
}

/**
 * The frame around a wall exhibit, by mode: a deep frame with a paper mat
 * (Business, gallery) or a dark monitor bezel with a glowing edge
 * (Developer, terminal). Children are drawn on the exhibit's face.
 */
function Framed({ w, h, palette, children }: { w: number; h: number; palette: ScenePalette; children: ReactNode }) {
  if (palette.style.frames === "mat") {
    return (
      <group>
        <mesh position={[0, 0, -0.04]}>
          <boxGeometry args={[w + 0.7, h + 0.7, 0.1]} />
          <meshStandardMaterial color={palette.trim} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[w + 0.42, h + 0.42]} />
          <meshStandardMaterial color={palette.mat} roughness={0.9} />
        </mesh>
        <group position={[0, 0, 0.018]}>{children}</group>
      </group>
    );
  }
  return (
    <group>
      <mesh position={[0, 0, -0.07]}>
        <planeGeometry args={[w + 0.26, h + 0.26]} />
        <meshBasicMaterial color={palette.glow} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[w + 0.16, h + 0.16, 0.06]} />
        <meshStandardMaterial color={palette.trim} roughness={0.35} />
      </mesh>
      <group position={[0, 0, 0.005]}>{children}</group>
    </group>
  );
}

function ExhibitObject({ spec, texture, portrait, palette }: { spec: ExhibitSpec; texture: Texture | undefined; portrait: Texture | null; palette: ScenePalette }) {
  const [w, h] = FACE_SIZE[spec.kind];
  return (
    <group position={[spec.x, 0, spec.z]} rotation-y={spec.face}>
      {spec.kind === "wallPlaque" && (
        <group position={[0, spec.y ?? 2, 0.1]}>
          <Framed w={w} h={h} palette={palette}>
            <Face texture={texture} w={w} h={h} />
          </Framed>
          {/* Picture light above the frame. */}
          <mesh position={[0, h / 2 + 0.5, 0.02]}>
            <boxGeometry args={[w * 0.6, 0.04, 0.04]} />
            <meshBasicMaterial color={palette.glow} toneMapped={false} />
          </mesh>
        </group>
      )}

      {spec.kind === "noticeBoard" && (
        <group position={[0, 1.8, 0.1]}>
          <Framed w={w} h={h} palette={palette}>
            <Face texture={texture} w={w} h={h} />
          </Framed>
        </group>
      )}

      {spec.kind === "stand" && (
        <group>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[2.2, 1, 0.9]} />
            <meshStandardMaterial color={palette.trim} roughness={0.5} />
          </mesh>
          <group position={[0, 1.75, -0.1]} rotation-x={-0.18}>
            <mesh position={[0, 0, -0.04]}>
              <boxGeometry args={[w + 0.12, h + 0.12, 0.06]} />
              <meshStandardMaterial color={palette.trim} roughness={0.4} />
            </mesh>
            <Face texture={texture} w={w} h={h} />
          </group>
          <mesh position={[0, 0.01, 0.9]} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[1.25, 1.33, 48]} />
            <meshBasicMaterial color={palette.signMuted} toneMapped={false} />
          </mesh>
        </group>
      )}

      {spec.kind === "sealedDoor" && (
        <group position={[0, 0, 0.04]}>
          <mesh position={[0, 1.7, 0]}>
            <planeGeometry args={[2, 3.4]} />
            <meshStandardMaterial color={palette.trim} roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.7, 0.01]}>
            <circleGeometry args={[0.18, 24]} />
            <meshBasicMaterial color={palette.signMuted} toneMapped={false} />
          </mesh>
          <group position={[0, 3.95, 0.01]}>
            <Face texture={texture} w={w} h={h} />
          </group>
        </group>
      )}

      {spec.kind === "portrait" && (
        <group position={[0, 0, 0.06]}>
          {/* 4:5 portrait at eye level, framed in the mode's style. */}
          <group position={[0, 2.85, 0.04]}>
            <Framed w={2.24} h={2.8} palette={palette}>
              <mesh>
                <planeGeometry args={[2.24, 2.8]} />
                {portrait ? <meshBasicMaterial key={portrait.uuid} map={portrait} toneMapped={false} /> : <meshBasicMaterial key="empty" color={palette.signBg} />}
              </mesh>
            </Framed>
          </group>
          <group position={[0, 0.75, 0]}>
            <Face texture={texture} w={w} h={h} />
          </group>
        </group>
      )}

      {spec.kind === "signpost" && (
        <group>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 2.2, 12]} />
            <meshStandardMaterial color={palette.trim} roughness={0.6} />
          </mesh>
          {/* Board stands in front of the post, so the post never shows through it. */}
          <group position={[0, 1.95, 0.16]}>
            <mesh position={[0, 0, -0.03]}>
              <boxGeometry args={[w + 0.1, h + 0.1, 0.05]} />
              <meshStandardMaterial color={palette.trim} roughness={0.6} />
            </mesh>
            <Face texture={texture} w={w} h={h} />
          </group>
        </group>
      )}
    </group>
  );
}

/** One instanced box mesh for every furnishing of one kind. */
function FurnishingBatch({ items, color, glow = false }: { items: readonly Furnishing[]; color: string; glow?: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    items.forEach((f, i) => {
      o.position.set(f.x, f.h / 2, f.z);
      o.scale.set(f.w, f.h, f.d);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  if (items.length === 0) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]}>
      <boxGeometry args={[1, 1, 1]} />
      {glow ? <meshBasicMaterial color={color} toneMapped={false} /> : <meshStandardMaterial color={color} roughness={0.7} />}
    </instancedMesh>
  );
}

const byKind = (kind: FurnishingKind) => FURNISHINGS.filter((f) => f.kind === kind);
const BOOKCASES = byKind("bookcase");
interface Shelf {
  x: number;
  y: number;
  z: number;
  w: number;
}
/** Shelves on each bookcase's open face: lit lines (Developer) or dark ledges (Business). */
const SHELVES: Shelf[] = BOOKCASES.flatMap((b) => [0.7, 1.4, 2.1, 2.8].map((y) => ({ x: b.x, y, z: b.z + b.d / 2 + 0.01, w: b.w - 0.1 })));
const TREES = byKind("planter");

function Furnishings({ palette }: { palette: ScenePalette }) {
  const shelfRef = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = shelfRef.current;
    if (!mesh) return;
    const o = new Object3D();
    SHELVES.forEach((s, i) => {
      o.position.set(s.x, s.y, s.z);
      o.scale.set(s.w, 0.04, 0.02);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);
  return (
    <group>
      <FurnishingBatch items={BOOKCASES} color={palette.trim} />
      <instancedMesh ref={shelfRef} args={[undefined, undefined, SHELVES.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={palette.baseboard} toneMapped={false} />
      </instancedMesh>
      <FurnishingBatch items={byKind("cabinet")} color={palette.trim} />
      <FurnishingBatch items={byKind("workbench")} color={palette.trim} />
      <FurnishingBatch items={byKind("pegboard")} color={palette.signBg} />
      <FurnishingBatch items={byKind("bench")} color={palette.trim} />
      <FurnishingBatch items={byKind("planter")} color={palette.trim} />
      {/* Courtyard trees: a trunk and a simple crown per planter. */}
      {TREES.map((t) => (
        <group key={`${t.x},${t.z}`} position={[t.x, t.h, t.z]}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 1.8, 8]} />
            <meshStandardMaterial color={palette.trim} roughness={0.8} />
          </mesh>
          <mesh position={[0, 2.3, 0]}>
            <icosahedronGeometry args={[1.05, 0]} />
            <meshStandardMaterial color={palette.tree} roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Exhibits({ specs, mode, palette }: { specs: readonly ExhibitSpec[]; mode: Mode; palette: ScenePalette }) {
  const textures = usePlaqueTextures(specs, mode, palette);
  const portrait = usePortraitTexture(mode);
  return (
    <group>
      {specs.map((s) => (
        <ExhibitObject key={s.id} spec={s} texture={textures.get(s.id)} portrait={portrait} palette={palette} />
      ))}
      <Furnishings palette={palette} />
    </group>
  );
}
