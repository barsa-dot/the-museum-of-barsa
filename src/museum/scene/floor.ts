// Floor surfaces per mode: a glowing grid (Developer) or large stone tiles
// with fine joints (Business). One small canvas texture, repeated by world
// size: each floor's UVs are scaled so a tile is always FLOOR_TILE metres.

import { useEffect, useMemo } from "react";
import { CanvasTexture, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace } from "three";
import type { ScenePalette } from "./palette";

/** Metres covered by one repeat of the floor texture. */
export const FLOOR_TILE = 2;

export function makeFloorTexture(palette: ScenePalette): CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = palette.floor;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = palette.floorLine;
  if (palette.style.floor === "grid") {
    // Terminal grid: a fine line every half metre, a brighter one per tile.
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    for (const p of [size / 4, size / 2, (size * 3) / 4]) {
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
    }
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size - 2);
  } else {
    // Stone: gentle mottling and a fine joint around each tile.
    for (let i = 0; i < 900; i++) {
      ctx.globalAlpha = Math.random() * 0.05;
      ctx.fillStyle = Math.random() > 0.5 ? "#ffffff" : "#000000";
      ctx.fillRect(Math.random() * size, Math.random() * size, 2 + Math.random() * 6, 2 + Math.random() * 6);
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size - 2);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** A floor plane whose texture repeats once per FLOOR_TILE metres. */
export function floorGeometry(width: number, depth: number): PlaneGeometry {
  const geometry = new PlaneGeometry(width, depth);
  const uv = geometry.attributes.uv!;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * width) / FLOOR_TILE, (uv.getY(i) * depth) / FLOOR_TILE);
  uv.needsUpdate = true;
  return geometry;
}

/** The shared floor material for a mode (disposed when the mode changes). */
export function useFloorMaterial(palette: ScenePalette): MeshStandardMaterial {
  const material = useMemo(() => {
    const map = makeFloorTexture(palette);
    return new MeshStandardMaterial({ map, roughness: palette.style.floor === "grid" ? 0.9 : 0.75 });
  }, [palette]);
  useEffect(
    () => () => {
      material.map?.dispose();
      material.dispose();
    },
    [material],
  );
  return material;
}
