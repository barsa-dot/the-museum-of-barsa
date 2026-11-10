// Design tokens for both visual modes.
//
// This file is the source of truth. `src/styles/tokens.css` mirrors it as CSS
// custom properties (kept in sync by tokens.test.ts) and the 3D scene reads
// colours from here directly.
//
// Both modes define the SAME token names, so every component works in either
// mode; only the values differ. Colours were sampled from the owner's two
// reference images (see docs/design-tokens.md).

import type { Mode } from "../data/profile/presentation";

export interface ColorTokens {
  /** Page background. */
  bg: string;
  /** Panels, cards, sections. */
  surface: string;
  /** Raised panels, hovered rows, inputs. */
  surfaceRaised: string;
  /** Hairlines and dividers. */
  border: string;
  /** Emphasised rules, frames, active outlines. */
  borderStrong: string;
  /** Body text. */
  text: string;
  /** Secondary text (captions, metadata). Still meets WCAG AA. */
  textMuted: string;
  /** Display headings. */
  heading: string;
  /** Primary accent: links, active states, key marks. */
  accent: string;
  /** Text or icons placed on an accent fill. */
  onAccent: string;
  /** Quiet accent for inactive marks, progress tracks. */
  accentMuted: string;
  /** Keyboard focus ring. */
  focus: string;
  /** Dark frame used around media (film frame / terminal window chrome). */
  frame: string;
}

export interface FontTokens {
  /** Large display type (pixel face in Developer, serif display in Business). Headings only. */
  display: string;
  /** Section and card headings. */
  heading: string;
  /** Paragraphs. Never a pixel face. */
  body: string;
  /** Small labels, metadata, numbering. */
  label: string;
}

export interface ShapeTokens {
  radiusSm: string;
  radiusMd: string;
  borderWidth: string;
  /** Card / panel elevation. */
  shadowCard: string;
  /** Large raised elements such as the identity card. */
  shadowRaised: string;
}

export interface TypeScaleTokens {
  /** Letter spacing for small uppercase labels. */
  trackingLabel: string;
  /** Letter spacing for display headings. */
  trackingDisplay: string;
  leadingTight: string;
  leadingBody: string;
}

export interface EffectTokens {
  /** CRT scanline overlay strength (Developer). 0 disables. */
  scanlineOpacity: string;
  /** Paper grain overlay strength (Business). 0 disables. */
  grainOpacity: string;
}

export interface ModeTokens {
  color: ColorTokens;
  font: FontTokens;
  shape: ShapeTokens;
  type: TypeScaleTokens;
  effect: EffectTokens;
}

// ---------- Fonts ----------
// Families are loaded per mode when the app shell is built; fallbacks keep
// layouts usable before (or without) the web fonts.

const MONO_FALLBACK = 'ui-monospace, "Cascadia Code", "SFMono-Regular", Consolas, "Liberation Mono", monospace';
const SERIF_FALLBACK = 'Georgia, "Times New Roman", serif';
const SANS_FALLBACK = 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

// ---------- Developer Mode ----------
// Reference: dark terminal / pixel portfolio. Near-black green-tinted ground,
// pale phosphor display type, mint accent for actions.

export const developer: ModeTokens = {
  color: {
    bg: "#070A08",
    surface: "#0B120E",
    surfaceRaised: "#111B15",
    border: "#1C2B24",
    borderStrong: "#477C5C",
    text: "#CDEBD8",
    textMuted: "#8AAE98",
    heading: "#C4F3D5",
    accent: "#3DD39E",
    onAccent: "#04140C",
    accentMuted: "#3F7A5C",
    focus: "#8FE6B4",
    frame: "#030504",
  },
  font: {
    display: `"Silkscreen", ${MONO_FALLBACK}`,
    heading: `"JetBrains Mono", ${MONO_FALLBACK}`,
    body: `"JetBrains Mono", ${MONO_FALLBACK}`,
    label: `"JetBrains Mono", ${MONO_FALLBACK}`,
  },
  shape: {
    radiusSm: "2px",
    radiusMd: "4px",
    borderWidth: "1px",
    shadowCard: "0 0 0 1px #1C2B24",
    shadowRaised: "0 0 24px rgba(61, 211, 158, 0.12)",
  },
  type: {
    trackingLabel: "0.04em",
    trackingDisplay: "0.02em",
    leadingTight: "1.15",
    leadingBody: "1.65",
  },
  effect: {
    scanlineOpacity: "0.04",
    grainOpacity: "0",
  },
};

// ---------- Business Mode ----------
// Reference: cream editorial / film-frame portfolio. Warm paper, deep ink,
// high-contrast serif display, burgundy accent used sparingly.

export const business: ModeTokens = {
  color: {
    bg: "#F4EAD8",
    surface: "#FBF2E6",
    surfaceRaised: "#FFF9F1",
    border: "#E2D7C5",
    borderStrong: "#1E1C19",
    text: "#1E1C19",
    textMuted: "#5C5347",
    heading: "#16140F",
    accent: "#873F40",
    onAccent: "#FBF2E6",
    accentMuted: "#C9A9A0",
    focus: "#873F40",
    frame: "#1F1A14",
  },
  font: {
    display: `"Playfair Display", ${SERIF_FALLBACK}`,
    heading: `"Playfair Display", ${SERIF_FALLBACK}`,
    body: `"Source Serif 4", ${SERIF_FALLBACK}`,
    label: `"Inter", ${SANS_FALLBACK}`,
  },
  shape: {
    radiusSm: "0px",
    radiusMd: "2px",
    borderWidth: "1px",
    shadowCard: "0 1px 2px rgba(30, 28, 25, 0.06), 0 4px 16px rgba(30, 28, 25, 0.06)",
    shadowRaised: "0 2px 4px rgba(30, 28, 25, 0.08), 0 18px 40px rgba(30, 28, 25, 0.16)",
  },
  type: {
    trackingLabel: "0.14em",
    trackingDisplay: "-0.01em",
    leadingTight: "1.05",
    leadingBody: "1.6",
  },
  effect: {
    scanlineOpacity: "0",
    grainOpacity: "0.05",
  },
};

export const modeTokens: Record<Mode, ModeTokens> = { developer, business };

// ---------- Shared (mode-independent) ----------

/** 4px-based spacing scale, shared so layouts line up across modes. */
export const space = {
  "1": "0.25rem",
  "2": "0.5rem",
  "3": "0.75rem",
  "4": "1rem",
  "5": "1.5rem",
  "6": "2rem",
  "7": "3rem",
  "8": "4rem",
  "9": "6rem",
} as const;

/** Fluid type scale (min at 360px wide, max at 1440px). */
export const textSize = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "clamp(1.125rem, 1.05rem + 0.33vw, 1.25rem)",
  xl: "clamp(1.375rem, 1.2rem + 0.75vw, 1.75rem)",
  "2xl": "clamp(1.75rem, 1.4rem + 1.5vw, 2.5rem)",
  "3xl": "clamp(2.25rem, 1.6rem + 2.8vw, 4rem)",
  display: "clamp(2.75rem, 1.6rem + 5vw, 6rem)",
} as const;

/** Motion. Reduced-motion users get near-zero durations (see tokens.css). */
export const motion = {
  durationFast: "150ms",
  durationBase: "300ms",
  durationSlow: "700ms",
  /** UI state changes. */
  easeStandard: "cubic-bezier(0.2, 0, 0, 1)",
  /** Entrances such as the identity card settling. No overshoot/bounce. */
  easeEmphasis: "cubic-bezier(0.16, 1, 0.3, 1)",
  easeExit: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

/** Text/background pairs that must meet WCAG AA (4.5:1) in each mode. */
export const CONTRAST_PAIRS: readonly [keyof ColorTokens, keyof ColorTokens][] = [
  ["text", "bg"],
  ["text", "surface"],
  ["text", "surfaceRaised"],
  ["textMuted", "bg"],
  ["textMuted", "surface"],
  ["textMuted", "surfaceRaised"],
  ["heading", "bg"],
  ["heading", "surface"],
  ["accent", "bg"],
  ["accent", "surface"],
  ["onAccent", "accent"],
];

/** Non-text UI pairs that must meet WCAG 1.4.11 (3:1). */
export const UI_CONTRAST_PAIRS: readonly [keyof ColorTokens, keyof ColorTokens][] = [
  ["focus", "bg"],
  ["focus", "surface"],
  ["borderStrong", "bg"],
];
