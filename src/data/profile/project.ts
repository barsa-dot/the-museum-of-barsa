// Project records come from the project registry, `projects.json`, which the
// current site also reads. This module types that file and validates it at
// runtime, so a bad edit fails a test instead of breaking the Creation Wing.

import { MODES, type Mode, type ModePresentation, type Presentation } from "./presentation";

/**
 * Publication state. Only `published` and `unavailable` projects are shown as
 * exhibits; `in-development` shows a sealed door with the name only;
 * `ready-for-review` is not shown at all until the owner approves it.
 */
export const PROJECT_STATUSES = [
  "in-development",
  "ready-for-review",
  "published",
  "unavailable",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface ProjectScreenshot {
  /** Site-root-relative path, e.g. "images/tasknest-1.png". */
  src: string;
  alt: string;
  /** Optional caption shown under the image. */
  caption?: string;
}

/** Kinds of evidence that back a project's claims. */
export const EVIDENCE_KINDS = ["tests", "documentation", "demo", "repository", "audit", "other"] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

/**
 * One piece of evidence: something a visitor (or the owner) can check, such
 * as a passing test suite or a design document. `checked` records when it
 * was last confirmed, so stale evidence is visible.
 */
export interface ProjectEvidence {
  kind: EvidenceKind;
  /** What it shows, e.g. "216 unit tests pass". */
  label: string;
  /** Optional https:// link to the evidence. */
  url?: string;
  /** Date last confirmed, YYYY-MM-DD. */
  checked?: string;
}

/** Latest release, as approved for display. */
export interface ProjectRelease {
  /** Version label as the project uses it, e.g. "1.2.0" or "v2". */
  version: string;
  /** Release date, YYYY-MM-DD. */
  date: string;
  /** Optional https:// link to the release notes. */
  notesUrl?: string;
}

/**
 * A project record. One structure serves every exhibit, in both modes:
 * modes choose the order and emphasis of these parts, never their facts.
 *
 * Exhibit parts, all optional except the basics:
 * - problem: what the project is for, and for whom
 * - approach: how it tackles that problem
 * - features: what it does (visitor-facing)
 * - implementation: how it is built (architecture, notable engineering)
 * - stack: technologies
 * - evidence: checkable proof of the claims
 * - liveUrl / githubUrl: demo and code
 * - screenshots
 * - limitations: what it does not do yet, stated plainly
 */
export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  tagline: string;
  description: string;
  role?: string;
  timeline?: string;
  problem?: string;
  approach?: string;
  features?: string[];
  implementation?: string[];
  stack?: string[];
  evidence?: ProjectEvidence[];
  /** Empty string hides the link. */
  liveUrl: string;
  /** Empty string hides the link. */
  githubUrl: string;
  screenshots: ProjectScreenshot[];
  limitations: string[];
  /** Optional latest release. */
  release?: ProjectRelease;
  /** Optional per-mode ordering, emphasis and wording (see presentation.ts). */
  presentation?: Presentation;
}

/** The parts of a project exhibit, as rendered (see PROJECT_PART_ORDER in presentation.ts). */
export const PROJECT_PARTS = [
  "problem",
  "approach",
  "features",
  "implementation",
  "stack",
  "evidence",
  "screenshots",
  "limitations",
] as const;
export type ProjectPart = (typeof PROJECT_PARTS)[number];

/** Whether a project has content for an exhibit part. */
export function hasPart(project: Project, part: ProjectPart): boolean {
  const value = project[part];
  if (value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  return value.length > 0;
}

/**
 * What an exhibited project still lacks against the publication checklist
 * (CLAUDE.md section 5). Used by tests and audits; never shown to visitors.
 */
export function publicationGaps(project: Project): string[] {
  const gaps: string[] = [];
  if (project.description.trim() === "") gaps.push("description");
  if (!hasPart(project, "features")) gaps.push("features");
  if (!hasPart(project, "limitations")) gaps.push("limitations");
  if (!hasPart(project, "evidence")) gaps.push("evidence");
  if (!hasPart(project, "screenshots") && project.liveUrl === "") gaps.push("screenshots or a live demo");
  return gaps;
}

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function readPresentation(raw: unknown, path: string): Presentation {
  if (typeof raw !== "object" || raw === null) fail(path, "must be an object");
  const result: Presentation = {};
  for (const [mode, value] of Object.entries(raw)) {
    const modePath = `${path}.${mode}`;
    if (!(MODES as readonly string[]).includes(mode)) fail(modePath, `unknown mode (use ${MODES.join(" or ")})`);
    if (typeof value !== "object" || value === null) fail(modePath, "must be an object");
    const v = value as Record<string, unknown>;
    const out: ModePresentation = {};
    for (const key of Object.keys(v)) {
      if (!["summary", "tags", "priority", "featured"].includes(key)) fail(`${modePath}.${key}`, "unknown field");
    }
    if ("summary" in v) out.summary = readString(v, "summary", modePath);
    if ("tags" in v) out.tags = readStringList(v, "tags", modePath);
    if ("priority" in v) {
      if (typeof v["priority"] !== "number" || !Number.isFinite(v["priority"])) fail(`${modePath}.priority`, "must be a number");
      out.priority = v["priority"];
    }
    if ("featured" in v) {
      if (typeof v["featured"] !== "boolean") fail(`${modePath}.featured`, "must be true or false");
      out.featured = v["featured"];
    }
    result[mode as Mode] = out;
  }
  return result;
}

function fail(path: string, message: string): never {
  throw new Error(`projects.json ${path}: ${message}`);
}

function readString(value: Record<string, unknown>, key: string, path: string): string {
  const field = value[key];
  if (typeof field !== "string") fail(`${path}.${key}`, "must be a string");
  return field;
}

function readStringList(value: Record<string, unknown>, key: string, path: string): string[] {
  const field = value[key];
  if (!Array.isArray(field) || !field.every((item) => typeof item === "string")) {
    fail(`${path}.${key}`, "must be a list of strings");
  }
  return field;
}

function readUrl(value: Record<string, unknown>, key: string, path: string): string {
  const url = readString(value, key, path);
  if (url !== "" && !/^https:\/\//.test(url)) fail(`${path}.${key}`, "must be empty or an https:// URL");
  return url;
}

const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function readEvidence(raw: unknown, path: string): ProjectEvidence[] {
  if (!Array.isArray(raw)) fail(path, "must be a list");
  return raw.map((item: unknown, i): ProjectEvidence => {
    const itemPath = `${path}[${i}]`;
    if (typeof item !== "object" || item === null) fail(itemPath, "must be an object");
    const v = item as Record<string, unknown>;
    for (const key of Object.keys(v)) {
      if (!["kind", "label", "url", "checked"].includes(key)) fail(`${itemPath}.${key}`, "unknown field");
    }
    const kind = readString(v, "kind", itemPath);
    if (!(EVIDENCE_KINDS as readonly string[]).includes(kind)) fail(`${itemPath}.kind`, `must be one of ${EVIDENCE_KINDS.join(", ")}`);
    const label = readString(v, "label", itemPath);
    if (label.trim() === "") fail(`${itemPath}.label`, "must say what the evidence shows");
    const evidence: ProjectEvidence = { kind: kind as EvidenceKind, label };
    if ("url" in v) {
      const url = readUrl(v, "url", itemPath);
      if (url !== "") evidence.url = url;
    }
    if ("checked" in v) {
      const checked = readString(v, "checked", itemPath);
      if (!DATE_PATTERN.test(checked)) fail(`${itemPath}.checked`, "must be a date, YYYY-MM-DD");
      evidence.checked = checked;
    }
    return evidence;
  });
}

function readRelease(raw: unknown, path: string): ProjectRelease {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) fail(path, "must be an object");
  const v = raw as Record<string, unknown>;
  for (const key of Object.keys(v)) {
    if (!["version", "date", "notesUrl"].includes(key)) fail(`${path}.${key}`, "unknown field");
  }
  const version = readString(v, "version", path);
  if (version.trim() === "") fail(`${path}.version`, "must not be empty");
  const date = readString(v, "date", path);
  if (!DATE_PATTERN.test(date)) fail(`${path}.date`, "must be a date, YYYY-MM-DD");
  const release: ProjectRelease = { version, date };
  if ("notesUrl" in v) {
    const url = readUrl(v, "notesUrl", path);
    if (url !== "") release.notesUrl = url;
  }
  return release;
}

/** Validates the parsed contents of projects.json and returns typed records. */
export function parseProjects(json: unknown): Project[] {
  if (!Array.isArray(json)) fail("", "must be a list of projects");

  const seen = new Set<string>();

  return json.map((entry: unknown, index): Project => {
    const path = `[${index}]`;
    if (typeof entry !== "object" || entry === null) fail(path, "must be an object");
    const value = entry as Record<string, unknown>;

    const id = readString(value, "id", path);
    if (!ID_PATTERN.test(id)) fail(`${path}.id`, `"${id}" must be lowercase-kebab`);
    if (seen.has(id)) fail(`${path}.id`, `duplicate id "${id}"`);
    seen.add(id);

    const status = readString(value, "status", path);
    if (!(PROJECT_STATUSES as readonly string[]).includes(status)) {
      fail(`${path}.status`, `"${status}" must be one of ${PROJECT_STATUSES.join(", ")}`);
    }

    const screenshots = value["screenshots"];
    if (!Array.isArray(screenshots)) fail(`${path}.screenshots`, "must be a list");

    const project: Project = {
      id,
      name: readString(value, "name", path),
      status: status as ProjectStatus,
      tagline: readString(value, "tagline", path),
      description: readString(value, "description", path),
      liveUrl: readUrl(value, "liveUrl", path),
      githubUrl: readUrl(value, "githubUrl", path),
      screenshots: screenshots.map((shot: unknown, i): ProjectScreenshot => {
        const shotPath = `${path}.screenshots[${i}]`;
        if (typeof shot !== "object" || shot === null) fail(shotPath, "must be an object");
        const s = shot as Record<string, unknown>;
        const alt = readString(s, "alt", shotPath);
        if (alt.trim() === "") fail(`${shotPath}.alt`, "must describe the screenshot");
        const result: ProjectScreenshot = { src: readString(s, "src", shotPath), alt };
        if ("caption" in s) result.caption = readString(s, "caption", shotPath);
        return result;
      }),
      limitations: readStringList(value, "limitations", path),
    };

    if ("role" in value) project.role = readString(value, "role", path);
    if ("timeline" in value) project.timeline = readString(value, "timeline", path);
    if ("problem" in value) project.problem = readString(value, "problem", path);
    if ("approach" in value) project.approach = readString(value, "approach", path);
    if ("features" in value) project.features = readStringList(value, "features", path);
    if ("implementation" in value) project.implementation = readStringList(value, "implementation", path);
    if ("evidence" in value) project.evidence = readEvidence(value["evidence"], `${path}.evidence`);
    if ("stack" in value) project.stack = readStringList(value, "stack", path);
    if ("release" in value) project.release = readRelease(value["release"], `${path}.release`);
    if ("presentation" in value) project.presentation = readPresentation(value["presentation"], `${path}.presentation`);

    return project;
  });
}
