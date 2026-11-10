// The Museum of Barsa — canonical profile data model.
//
// One typed source for every fact about the owner. Every view (both visual
// modes, the 3D rooms and the plain fallback) renders from this model, so the
// same records are available everywhere.
//
// Rules:
// - Unknown details are `null` or empty, never guessed.
// - Every record says whether the owner has confirmed it. Only confirmed
//   records are published (see `publishable()` in selectors.ts).
// - Projects live in the separate project registry (`projects.json`) and are
//   typed in project.ts.

import type { Presentation } from "./presentation";

/** Whether the owner has confirmed this record is accurate and may be public. */
export type Verification = "verified" | "unverified";

/** Fields shared by every record in a collection. */
export interface RecordBase {
  /** Stable, unique, lowercase-kebab id (used for links and cross-references). */
  id: string;
  verification: Verification;
  /** Optional per-mode ordering, emphasis and wording (see presentation.ts). */
  presentation?: Presentation;
}

/** A partial date: "2024" or "2024-07". */
export type PartialDate = `${number}` | `${number}-${number}`;

export interface DateRange {
  /** `null` when not yet known. */
  start: PartialDate | null;
  /** `"present"` for ongoing; `null` when not yet known. */
  end: PartialDate | "present" | null;
}

export interface Link {
  label: string;
  url: string;
}

export interface ImageAsset {
  /** Site-root-relative path, e.g. "images/portrait.jpg". */
  src: string;
  alt: string;
  width: number;
  height: number;
}

// ---------- Identity ----------

export interface Person {
  name: string;
  /** One-line description shown beside the name. */
  headline: string | null;
  /** Short personal introduction (a paragraph or two). */
  introduction: string | null;
  interests: string[];
  verification: Verification;
}

/**
 * Portrait assets. All `null` until the owner supplies a real photograph;
 * views must then show a clearly labelled placeholder, never another face.
 */
export interface Portrait {
  /** The owner's photograph (used for the Business identity card). */
  photo: ImageAsset | null;
  /** Pixel-art treatment of the same photograph (Developer hero). */
  pixel: ImageAsset | null;
}

// ---------- Collections ----------

export interface Education extends RecordBase {
  institution: string;
  /** e.g. "B.Tech", "BBA". */
  qualification: string;
  field: string;
  dates: DateRange;
  description: string | null;
}

export type AchievementKind = "academic" | "award" | "certification";

export interface Achievement extends RecordBase {
  kind: AchievementKind;
  title: string;
  issuer: string | null;
  date: PartialDate | null;
  description: string | null;
  /** Link to a certificate, announcement or other evidence. */
  evidenceUrl: string | null;
  /** Optional link to the related education record. */
  educationId: string | null;
}

export const EXPERIENCE_KINDS = ["work", "writing", "volunteering", "event", "leadership"] as const;
export type ExperienceKind = (typeof EXPERIENCE_KINDS)[number];

export interface Experience extends RecordBase {
  kind: ExperienceKind;
  organisation: string;
  /** Job title or the owner's part in it; `null` until confirmed. */
  role: string | null;
  dates: DateRange;
  description: string | null;
  links: Link[];
}

export type SkillCategory =
  | "language"
  | "framework"
  | "tool"
  | "data"
  | "business"
  | "communication";

export interface Skill extends RecordBase {
  name: string;
  category: SkillCategory;
}

// ---------- Contact ----------

export interface Contact {
  email: string | null;
  github: Link | null;
  linkedin: Link | null;
  /** Site-root-relative path to the resume PDF, `null` until supplied. */
  resume: string | null;
  other: Link[];
  verification: Verification;
}

// ---------- The whole profile ----------

export interface Profile {
  person: Person;
  portrait: Portrait;
  education: Education[];
  achievements: Achievement[];
  experience: Experience[];
  skills: Skill[];
  contact: Contact;
}
