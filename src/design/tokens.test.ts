import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CONTRAST_PAIRS,
  UI_CONTRAST_PAIRS,
  modeTokens,
  motion,
  space,
  textSize,
  type ModeTokens,
} from "./tokens";
import { MODES } from "../data/profile/presentation";

// ---------- WCAG contrast ----------

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe.each(MODES)("%s mode colours", (mode) => {
  const c = modeTokens[mode].color;

  it("are all 6-digit hex values", () => {
    for (const value of Object.values(c)) expect(value).toMatch(/^#[0-9A-F]{6}$/);
  });

  it.each(CONTRAST_PAIRS)("%s on %s meets WCAG AA (4.5:1)", (fg, bg) => {
    expect(contrast(c[fg], c[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(UI_CONTRAST_PAIRS)("%s against %s meets 3:1 for UI", (fg, bg) => {
    expect(contrast(c[fg], c[bg])).toBeGreaterThanOrEqual(3);
  });
});

describe("modes", () => {
  it("define the same token names", () => {
    const shape = (t: ModeTokens) =>
      Object.fromEntries(Object.entries(t).map(([group, values]) => [group, Object.keys(values).sort()]));
    expect(shape(modeTokens.developer)).toEqual(shape(modeTokens.business));
  });

  it("are visually distinct, not a colour swap", () => {
    const d = modeTokens.developer, b = modeTokens.business;
    expect(luminance(d.color.bg)).toBeLessThan(0.02);
    expect(luminance(b.color.bg)).toBeGreaterThan(0.75);
    expect(d.font.display).not.toEqual(b.font.display);
    expect(d.font.body).not.toEqual(b.font.body);
  });

  it("never use a pixel face for body text", () => {
    for (const mode of MODES) expect(modeTokens[mode].font.body).not.toMatch(/Silkscreen|Pixel|Press Start|VT323/i);
  });
});

// ---------- CSS mirror ----------

const css = readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8");
const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`missing block ${selector}`);
  const body = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]!.trim()]));
}

describe("tokens.css", () => {
  it.each(MODES)("matches tokens.ts for %s mode", (mode) => {
    const t = modeTokens[mode];
    const expected: Record<string, string> = {
      ...Object.fromEntries(Object.entries(t.color).map(([k, v]) => [`color-${kebab(k)}`, v])),
      ...Object.fromEntries(Object.entries(t.font).map(([k, v]) => [`font-${k}`, v])),
      "radius-sm": t.shape.radiusSm,
      "radius-md": t.shape.radiusMd,
      "border-width": t.shape.borderWidth,
      "shadow-card": t.shape.shadowCard,
      "shadow-raised": t.shape.shadowRaised,
      ...Object.fromEntries(Object.entries(t.type).map(([k, v]) => [kebab(k), v])),
      ...Object.fromEntries(Object.entries(t.effect).map(([k, v]) => [kebab(k), v])),
    };
    expect(block(`[data-mode="${mode}"]`)).toEqual(expected);
  });

  it("matches the shared spacing, type and motion tokens", () => {
    const expected = {
      ...Object.fromEntries(Object.entries(space).map(([k, v]) => [`space-${k}`, v])),
      ...Object.fromEntries(Object.entries(textSize).map(([k, v]) => [`text-${k}`, v])),
      ...Object.fromEntries(Object.entries(motion).map(([k, v]) => [kebab(k), v])),
    };
    expect(block(":root")).toEqual(expected);
  });

  it("shortens motion for reduced-motion users", () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*--duration-slow: 1ms/);
  });
});
