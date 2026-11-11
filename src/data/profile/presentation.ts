// Mode presentation metadata.
//
// Both modes show the SAME records. A mode may change only:
// - the order of sections and of records within a section,
// - which records are visually featured,
// - an alternative summary that rewords the same facts for that audience,
// - display tags.
// It may never hide a record or add a fact. viewFor() enforces this: it
// reorders and annotates, but every publishable record comes out in both modes.

import type { AchievementKind, ExperienceKind, SkillCategory } from "./types";
import type { ProjectPart } from "./project";

export const MODES = ["developer", "business"] as const;
export type Mode = (typeof MODES)[number];

/** How one record is presented in one mode. All fields optional. */
export interface ModePresentation {
  /**
   * Alternative wording of the record's own description for this mode.
   * Must describe the same work; only allowed when the record has a
   * description to reword (checked by tests).
   */
  summary?: string;
  /** Display tags, e.g. technical tags in Developer, impact tags in Business. */
  tags?: string[];
  /** Lower comes first within its section. Records without one keep source order, after prioritised ones. */
  priority?: number;
  /** Give the record extra visual prominence in this mode. */
  featured?: boolean;
}

export type Presentation = Partial<Record<Mode, ModePresentation>>;

/** Content sections, each available in both modes. */
export const SECTIONS = [
  "about",
  "education",
  "achievements",
  "experience",
  "projects",
  "skills",
  "contact",
] as const;
export type SectionId = (typeof SECTIONS)[number];

/**
 * Section order per mode. Each list must contain every section exactly once
 * (checked by tests), so no mode can silently drop a section.
 */
export const SECTION_ORDER: Record<Mode, readonly SectionId[]> = {
  // Technical work first.
  developer: ["about", "projects", "skills", "experience", "education", "achievements", "contact"],
  // Education, business and communication work first.
  business: ["about", "education", "experience", "achievements", "projects", "skills", "contact"],
};

/** Order of skill groups per mode (presentation only; every group is shown). */
export const SKILL_CATEGORY_ORDER = {
  developer: ["language", "framework", "data", "tool", "business", "communication"],
  business: ["business", "communication", "language", "framework", "data", "tool"],
} as const satisfies Record<Mode, readonly SkillCategory[]>;

/**
 * Skills fall into two families: technical skills and broader capabilities.
 * Every category belongs to exactly one family (checked by tests). Modes
 * distinguish them by order and presentation, never by leaving one out.
 */
export const SKILL_FAMILIES = {
  technical: ["language", "framework", "data", "tool"],
  broader: ["business", "communication"],
} as const satisfies Record<string, readonly SkillCategory[]>;
export type SkillFamily = keyof typeof SKILL_FAMILIES;

export function skillFamily(category: SkillCategory): SkillFamily {
  return (SKILL_FAMILIES.broader as readonly SkillCategory[]).includes(category) ? "broader" : "technical";
}

/** Family order per mode, following the mode's category order. */
export function skillFamilyOrder(mode: Mode): SkillFamily[] {
  return [...new Set(SKILL_CATEGORY_ORDER[mode].map(skillFamily))];
}

/**
 * Order of experience types per mode (presentation only; every entry is
 * shown). Developer leads with work and leadership; Business with work and
 * then communication, content and collaboration (writing, volunteering,
 * events), as the brief asks.
 */
export const EXPERIENCE_KIND_ORDER = {
  developer: ["work", "leadership", "writing", "event", "volunteering"],
  business: ["work", "writing", "volunteering", "event", "leadership"],
} as const satisfies Record<Mode, readonly ExperienceKind[]>;

/** Order of achievement types per mode: technical learning first in Developer, recognition first in Business. */
export const ACHIEVEMENT_KIND_ORDER = {
  developer: ["certification", "academic", "award"],
  business: ["award", "academic", "certification"],
} as const satisfies Record<Mode, readonly AchievementKind[]>;

/** Anything that can carry presentation metadata. */
export interface Presentable {
  presentation?: Presentation;
}

export function presentationFor(record: Presentable, mode: Mode): ModePresentation {
  return record.presentation?.[mode] ?? {};
}

/**
 * Returns a new array ordered for the mode: records with a priority first
 * (ascending), then the rest in their original order. Never removes records.
 */
export function orderForMode<T extends Presentable>(records: readonly T[], mode: Mode): T[] {
  return records
    .map((record, index) => ({ record, index, priority: presentationFor(record, mode).priority }))
    .sort((a, b) => {
      if (a.priority !== undefined && b.priority !== undefined) return a.priority - b.priority || a.index - b.index;
      if (a.priority !== undefined) return -1;
      if (b.priority !== undefined) return 1;
      return a.index - b.index;
    })
    .map(({ record }) => record);
}

/** The text to show for a record in a mode: the mode summary if any, else the record's own description. */
export function summaryFor(record: Presentable & { description: string | null }, mode: Mode): string | null {
  return presentationFor(record, mode).summary ?? record.description;
}

/**
 * Order of a project exhibit's parts per mode. Each list holds every part
 * exactly once (checked by tests): Developer leads with how it is built,
 * Business with what it does and the proof. Limitations are never dropped.
 */
export const PROJECT_PART_ORDER = {
  developer: ["problem", "approach", "implementation", "stack", "features", "evidence", "screenshots", "limitations"],
  business: ["problem", "approach", "features", "evidence", "screenshots", "implementation", "stack", "limitations"],
} as const satisfies Record<Mode, readonly ProjectPart[]>;
