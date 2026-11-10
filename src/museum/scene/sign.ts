// Room signs drawn onto a canvas in the mode's own web fonts (already
// self-hosted for the site), then used as textures. No 3D text library.

import { CanvasTexture, SRGBColorSpace } from "three";
import { modeTokens } from "../../design/tokens";
import type { Mode } from "../../data/profile/presentation";
import type { ScenePalette } from "./palette";

export const SIGN_ASPECT = 1024 / 288;

/** Waits (briefly) for the fonts a mode's signs use, so text isn't drawn in a fallback face. */
export async function loadSignFonts(mode: Mode): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const f = modeTokens[mode].font;
  const wait = Promise.all([document.fonts.load(`700 64px ${f.heading}`), document.fonts.load(`400 28px ${f.label}`), document.fonts.load(`400 36px ${f.body}`)]);
  await Promise.race([wait, new Promise((r) => setTimeout(r, 2500))]);
}

export function makeSignTexture(title: string, subtitle: string, mode: Mode, palette: ScenePalette): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 288;
  const ctx = canvas.getContext("2d")!;
  const f = modeTokens[mode].font;

  ctx.fillStyle = palette.signBg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = palette.signMuted;
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);

  ctx.textAlign = "center";
  ctx.fillStyle = palette.signMuted;
  ctx.font = `400 34px ${f.label}`;
  const label = mode === "business" ? subtitle.toUpperCase().split("").join(String.fromCharCode(8202)) : `> ${subtitle.toLowerCase()}`;
  ctx.fillText(label, canvas.width / 2, 88);

  ctx.fillStyle = palette.signText;
  let size = 88;
  ctx.font = `700 ${size}px ${f.heading}`;
  while (ctx.measureText(title).width > canvas.width - 100 && size > 40) {
    size -= 4;
    ctx.font = `700 ${size}px ${f.heading}`;
  }
  ctx.fillText(title, canvas.width / 2, 200);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * A plaque/screen face: small eyebrow, a title and up to four lines, drawn
 * in the mode's fonts. `aspect` is width / height of the surface it covers.
 */
export function makePlaqueTexture(
  plaque: { eyebrow: string; title: string; lines: string[] },
  mode: Mode,
  palette: ScenePalette,
  aspect: number,
): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = Math.round(1024 / aspect);
  const ctx = canvas.getContext("2d")!;
  const f = modeTokens[mode].font;
  const W = canvas.width;
  const H = canvas.height;
  const pad = 64;

  ctx.fillStyle = palette.signBg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = palette.signMuted;
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, W - 36, H - 36);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let y = pad + 34;
  ctx.fillStyle = palette.signMuted;
  ctx.font = `400 34px ${f.label}`;
  ctx.fillText(mode === "business" ? plaque.eyebrow.toUpperCase() : `> ${plaque.eyebrow.toLowerCase()}`, pad, y);

  // Title: wrap to at most three lines, shrinking if needed.
  ctx.fillStyle = palette.signText;
  let size = 80;
  const wrap = (text: string, max: number) => {
    const words = text.split(" ");
    const out: string[] = [];
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (ctx.measureText(next).width > max && line) {
        out.push(line);
        line = w;
      } else line = next;
    }
    if (line) out.push(line);
    return out;
  };
  let titleLines: string[];
  do {
    size -= 4;
    ctx.font = `700 ${size}px ${f.heading}`;
    titleLines = wrap(plaque.title, W - pad * 2);
  } while ((titleLines.length > 3 || titleLines.length * size * 1.15 > H * 0.5) && size > 34);
  y += 26;
  for (const line of titleLines) {
    y += size * 1.12;
    ctx.fillText(line, pad, y);
  }

  ctx.fillStyle = palette.signText;
  ctx.globalAlpha = 0.85;
  ctx.font = `400 36px ${f.body}`;
  y += 26;
  for (const line of plaque.lines.slice(0, 4)) {
    for (const part of wrap(line, W - pad * 2)) {
      y += 48;
      if (y > H - pad / 2) break;
      ctx.fillText(part, pad, y);
    }
  }
  ctx.globalAlpha = 1;

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
