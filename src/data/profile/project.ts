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
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  tagline: string;
  description: string;
  role?: string;
  timeline?: string;
  features?: string[];
  stack?: string[];
  /** Empty string hides the link. */
  liveUrl: string;
  /** Empty string hides the link. */
  githubUrl: string;
  screenshots: ProjectScreenshot[];
  limitations: string[];
  /** Optional per-mode ordering, emphasis and wording (see presentation.ts). */
  presentation?: Presentation;
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
        return { src: readString(s, "src", shotPath), alt };
      }),
      limitations: readStringList(value, "limitations", path),
    };

    if ("role" in value) project.role = readString(value, "role", path);
    if ("timeline" in value) project.timeline = readString(value, "timeline", path);
    if ("features" in value) project.features = readStringList(value, "features", path);
    if ("stack" in value) project.stack = readStringList(value, "stack", path);
    if ("presentation" in value) project.presentation = readPresentation(value["presentation"], `${path}.presentation`);

    return project;
  });
}
