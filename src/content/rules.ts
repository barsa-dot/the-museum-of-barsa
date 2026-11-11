// Common content rules shared by every view in both modes.
//
// - Missing details are left out, never shown as "null", "TBD" or placeholders.
// - Only https:, mailto: and site-relative links are rendered.
// - External links open in a new tab without giving it access to this page.
// - Dates are formatted the same way everywhere.

import type { DateRange, ExperienceKind, PartialDate, SkillCategory } from "../data/profile/types";
import type { SkillFamily } from "../data/profile/presentation";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2024" → "2024", "2024-07" → "Jul 2024". */
export function formatPartialDate(date: PartialDate): string {
  const [year, month] = date.split("-");
  const name = month ? MONTHS[Number(month) - 1] : undefined;
  return name ? `${name} ${year}` : `${year}`;
}

/** "2026-11-11" → "11 Nov 2026"; null if it is not a full date. */
export function formatFullDate(date: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const month = m ? MONTHS[Number(m[2]) - 1] : undefined;
  return m && month ? `${Number(m[3])} ${month} ${m[1]}` : null;
}

/** Formats a range, or returns null when nothing is known yet. */
export function formatDateRange({ start, end }: DateRange): string | null {
  const from = start ? formatPartialDate(start) : null;
  const to = end === "present" ? "Present" : end ? formatPartialDate(end) : null;
  if (from && to) return from === to ? from : `${from} – ${to}`;
  if (from) return from;
  if (to) return end === "present" ? null : to; // "– Present" alone says nothing useful
  return null;
}

/** True when a value has visible text. */
export function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/** Only allow link targets we trust to render. */
export function isSafeHref(href: string): boolean {
  return /^(https:\/\/|mailto:)/.test(href) || /^\/(?!\/)/.test(href);
}

/** Public path of the resume file (served from app/public), or null if none is configured. */
export function resumeHref(resume: string | null | undefined): string | null {
  if (!resume) return null;
  const href = `/${resume.replace(/^\/+/, "")}`;
  return isSafeHref(href) ? href : null;
}

export function isExternal(href: string): boolean {
  return href.startsWith("https://");
}

/** Attributes for a link, adding new-tab safety for external targets. */
export function linkProps(href: string): { href: string; target?: "_blank"; rel?: string } {
  return isExternal(href) ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };
}

export const EXPERIENCE_LABELS: Record<ExperienceKind, string> = {
  work: "Work",
  writing: "Writing",
  volunteering: "Volunteering",
  event: "Events",
  leadership: "Leadership",
};

export const SKILL_LABELS: Record<SkillCategory, string> = {
  language: "Languages",
  framework: "Frameworks and libraries",
  data: "Data",
  tool: "Tools",
  business: "Business",
  communication: "Communication",
};

export const SKILL_FAMILY_LABELS: Record<SkillFamily, string> = {
  technical: "Technical skills",
  broader: "Broader capabilities",
};

export const SECTION_TITLES = {
  about: "About",
  education: "Education",
  achievements: "Achievements",
  experience: "Experience",
  projects: "Projects",
  skills: "Skills",
  contact: "Contact",
} as const;
