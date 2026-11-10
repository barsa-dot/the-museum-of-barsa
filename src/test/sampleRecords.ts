// TEST-ONLY sample records. These are not facts about the owner: they exist
// to check that experience, achievements and skills render completely in
// both modes once real records are verified. Never import from app code.

import { profile, type Profile } from "../data/profile";
import type { Achievement, Experience, ExperienceKind } from "../data/profile/types";

const experience = (id: string, kind: ExperienceKind, organisation: string, role: string | null): Experience => ({
  id,
  verification: "verified",
  kind,
  organisation,
  role,
  dates: { start: "2024", end: "present" },
  description: `Sample description for ${id}.`,
  links: [],
});

const achievement = (id: string, kind: Achievement["kind"], title: string): Achievement => ({
  id,
  verification: "verified",
  kind,
  title,
  issuer: "Sample Issuer",
  date: "2024",
  description: null,
  evidenceUrl: null,
  educationId: null,
});

/** One record of every experience kind, in an order that matches neither mode. */
export const SAMPLE_EXPERIENCE: Experience[] = [
  experience("sample-volunteer", "volunteering", "Sample Volunteers", "Volunteer"),
  experience("sample-event", "event", "Sample Summit", "Organiser"),
  experience("sample-writing", "writing", "Sample Journal", "Writer"),
  experience("sample-lead", "leadership", "Sample Society", "Lead"),
  experience("sample-work", "work", "Sample Ltd", null),
];

export const SAMPLE_ACHIEVEMENTS: Achievement[] = [
  achievement("sample-award", "award", "Sample Award"),
  achievement("sample-cert", "certification", "Sample Certificate"),
  achievement("sample-academic", "academic", "Sample Honour"),
];

export function withSamples(extraExperience = 0, extraAchievements = 0): Profile {
  return {
    ...profile,
    experience: [
      ...SAMPLE_EXPERIENCE,
      ...Array.from({ length: extraExperience }, (_, i) => experience(`sample-extra-${i}`, "work", `Sample Extra ${i}`, "Role")),
    ],
    achievements: [
      ...SAMPLE_ACHIEVEMENTS,
      ...Array.from({ length: extraAchievements }, (_, i) => achievement(`sample-extra-award-${i}`, "award", `Sample Extra Award ${i}`)),
    ],
  };
}

/**
 * The candidate skills marked verified (for testing only; the owner has not
 * confirmed them), plus sample broader capabilities.
 */
export function withSampleSkills(): Profile {
  return {
    ...profile,
    skills: [
      ...profile.skills.map((s) => ({ ...s, verification: "verified" as const })),
      { id: "sample-strategy", verification: "verified", name: "Sample Strategy", category: "business" },
      { id: "sample-speaking", verification: "verified", name: "Sample Speaking", category: "communication" },
    ],
  };
}
