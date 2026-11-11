// Project manifests (task 6.2): `museum-manifest.json` kept in each project's
// own repository. A manifest is a PROPOSAL for that project's entry in
// projects.json; it is never published directly (see docs/project-registry.md).
//
// Validation reuses parseProjects(), so a manifest and the registry can never
// disagree about what a valid field looks like.

import { parseProjects, type Project, type ProjectStatus } from "./project";

export const MANIFEST_FILE = "museum-manifest.json";
export const MANIFEST_VERSION = 1;

/** The only statuses a manifest may request. Publishing is the owner's decision in this repository. */
export const MANIFEST_STATUSES = ["in-development", "ready-for-review"] as const;
export type ManifestStatus = (typeof MANIFEST_STATUSES)[number];

/** Manifest field → projects.json field, where the names differ. */
const RENAMED = { repositoryUrl: "githubUrl", demoUrl: "liveUrl" } as const;

const REQUIRED = ["manifestVersion", "id", "name", "status", "tagline", "description", "repositoryUrl", "demoUrl", "screenshots", "limitations"] as const;
const OPTIONAL = ["role", "timeline", "problem", "approach", "features", "implementation", "stack", "evidence", "release"] as const;

export interface ProjectManifest {
  manifestVersion: typeof MANIFEST_VERSION;
  id: string;
  status: ManifestStatus;
  /** The registry fields this manifest proposes (status excluded). */
  fields: Omit<Project, "status" | "presentation">;
}

function fail(path: string, message: string): never {
  throw new Error(`${MANIFEST_FILE}${path ? ` ${path}` : ""}: ${message}`);
}

/** Validates the parsed contents of a museum-manifest.json. */
export function parseManifest(json: unknown): ProjectManifest {
  if (typeof json !== "object" || json === null || Array.isArray(json)) fail("", "must be an object");
  const raw = json as Record<string, unknown>;

  for (const key of Object.keys(raw)) {
    if (!(REQUIRED as readonly string[]).includes(key) && !(OPTIONAL as readonly string[]).includes(key)) {
      fail(key, key === "presentation" ? "per-mode presentation is set in projects.json, not in a manifest" : "unknown field");
    }
  }
  for (const key of REQUIRED) if (!(key in raw)) fail(key, "is required");

  if (raw["manifestVersion"] !== MANIFEST_VERSION) fail("manifestVersion", `must be ${MANIFEST_VERSION}`);
  const status = raw["status"];
  if (typeof status !== "string" || !(MANIFEST_STATUSES as readonly string[]).includes(status)) {
    fail("status", `must be ${MANIFEST_STATUSES.join(" or ")}; publishing is done in the museum's projects.json`);
  }

  // Map to a registry entry and let the registry's own validator check it.
  const entry: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === "manifestVersion") continue;
    entry[RENAMED[key as keyof typeof RENAMED] ?? key] = value;
  }
  let project: Project;
  try {
    [project] = parseProjects([entry]) as [Project];
  } catch (error) {
    const message = (error as Error).message.replace(/^projects\.json \[0\]\.?/, "");
    // Report manifest field names, not registry ones.
    const named = Object.entries(RENAMED).reduce((m, [manifest, registry]) => m.replace(new RegExp(`^${registry}\\b`), manifest), message);
    throw new Error(`${MANIFEST_FILE} ${named}`);
  }

  const { status: _status, presentation: _presentation, ...fields } = project;
  return { manifestVersion: MANIFEST_VERSION, id: project.id, status: status as ManifestStatus, fields };
}

/**
 * The registry entry a manifest proposes, for the owner to review.
 *
 * - Content fields come from the manifest.
 * - Status: a published or temporarily closed project keeps its status (a
 *   manifest can't unpublish or publish); otherwise the manifest's request
 *   is used. New projects start at the manifest's status.
 * - Presentation (per-mode order and wording) stays as set in projects.json.
 */
export function manifestToProject(manifest: ProjectManifest, current?: Project): Project {
  if (current && current.id !== manifest.id) throw new Error(`manifest id "${manifest.id}" does not match project "${current.id}"`);
  const status: ProjectStatus =
    current && (current.status === "published" || current.status === "unavailable") ? current.status : manifest.status;
  const proposal: Project = { ...manifest.fields, status };
  if (current?.presentation) proposal.presentation = current.presentation;
  return proposal;
}
