# Project registry and manifests

How the museum knows about projects, and how that information may change.
Designed in task 6.1 (registry) and 6.2 (manifest format). Later tasks build
on it: GitHub metadata (6.3), validation in GitHub Actions (6.4), refresh and
deployment (6.5), availability checks (6.6) and approval controls (6.7).

## 1. One source of truth: `projects.json`

`projects.json`, at the repository root and under version control, is the
only place that decides **which projects exist on the portfolio, what they
say, and whether they are public**.

| Reader | How it reads the file |
|---|---|
| Current live site (`museum.js`, `rooms/creation-wing.html`, `quick-view.html`) | `fetch("/projects.json")` when the page opens |
| New app (`src/data/profile/index.ts`) | Imported at build time and checked by `parseProjects()`; a bad entry throws, and the tests read the real file |

Nothing else may hold project facts. Profile data (`profile.ts`) holds people,
education and experience, not projects. Visual design (styles, room layout,
exhibit components) holds no project facts, so a new project needs only a new
entry, never a redesign.

The field list and examples are in the README ("Adding or updating a project")
and the types in `src/data/profile/project.ts`.

## 2. Three kinds of information, kept apart

| Kind | Examples | Who writes it | Where |
|---|---|---|---|
| **Approved content** | name, tagline, description, problem, approach, features, implementation, stack, evidence, screenshots, limitations, links, release | The owner (by hand, or by accepting a proposal from a manifest, see 6.2) | `projects.json` |
| **Publication status** | `in-development`, `ready-for-review`, `published`, `unavailable` | The owner only (see section 3) | `projects.json` |
| **Observed signals** | latest commit date, latest release tag, "demo answered 200 at 09:00" | Automation (6.3, 6.6) | A separate generated file (planned: `generated/project-signals.json`), never `projects.json` |

Rules:

- Automation **never** writes approved content or status. It may only write
  signals, and signals may only *add* a dated fact ("last updated 3 Nov 2026",
  "demo unreachable since …"). They can't add descriptions or claims.
- A signal can make the site *more cautious* (for example, show a note that a
  demo is down) but never *less*: it can't publish, unseal or reword anything.
- Signals are keyed by project `id`; a signal for an unknown or sealed project
  is ignored.

## 3. Publication status

The project brief names four states; the code spells them in kebab-case.

| Brief | `projects.json` | Shown to visitors |
|---|---|---|
| in_development | `in-development` | Sealed "Opening soon" door, name only |
| ready_for_review | `ready-for-review` | Nothing (waiting for the owner) |
| published | `published` | Full exhibit |
| temporarily_unavailable | `unavailable` | Full exhibit, "Temporarily closed", live link hidden |

Allowed changes:

| From → to | Who |
|---|---|
| any → `in-development` / `ready-for-review` | Owner, or a manifest proposal the owner accepts |
| `ready-for-review` → `published` | **Owner only**, after the CLAUDE.md §5 checklist (`publicationGaps()` helps) |
| `published` ↔ `unavailable` | Owner. Automation may *suggest* it (6.6) but only shows a note itself |

A push to a project's repository can never change a status to `published`.
The test that pins the list of exhibited projects (`profile.test.ts`) makes
any publication a deliberate, reviewed change in this repository.

## 4. Project manifests (format: 6.2)

Each project's own repository may hold a small manifest,
`museum-manifest.json`, at its root. It is the project's **proposal** for
its museum entry: the owner keeps it next to the code so it can be updated in
the same commit as a feature.

```json
{
  "manifestVersion": 1,
  "id": "tasknest",
  "name": "TaskNest",
  "status": "ready-for-review",
  "tagline": "…",
  "description": "…",
  "features": ["…"],
  "screenshots": [{ "src": "docs/screenshots/today.webp", "alt": "…", "caption": "…" }],
  "repositoryUrl": "https://github.com/…",
  "demoUrl": "https://…",
  "release": { "version": "1.2.0", "date": "2026-11-02", "notesUrl": "https://…" },
  "limitations": ["…"]
}
```

Optional fields also include `role`, `timeline`, `problem`, `approach`,
`implementation`, `stack` and `evidence`, with the same meaning as in
`projects.json`.

| Field | Required | Notes |
|---|---|---|
| `manifestVersion` | yes | `1`. Lets the format change later without guessing |
| `id` | yes | Must match the project's `id` in `projects.json` |
| `name`, `tagline`, `description` | yes | Approved wording; may be `""` while unwritten |
| `status` | yes | Only `in-development` or `ready-for-review`. **A manifest can't request `published` or `unavailable`**: those are the owner's decisions in this repository |
| `repositoryUrl`, `demoUrl` | yes | `https://` or `""`. Map to `githubUrl` / `liveUrl` |
| `screenshots` | yes | Paths are relative to the project repository; they are copied into this repository's images when accepted. `[]` for none |
| `release` | no | `version` (text), `date` (YYYY-MM-DD), optional `notesUrl` (`https://`) |
| `limitations` | yes | `[]` for none |
| other optional fields | no | As in `projects.json` |

Unknown fields are refused, so a typo fails loudly.

How a manifest change reaches the museum (built in 6.4 and 6.5): validate it
→ compare it with the current entry → open a change in this repository for the
owner to review → the owner merges (and only then can change the status) →
deploy. Nothing is written to `projects.json` without that review.

The parser is `parseManifest()` in `src/data/profile/manifest.ts`;
`manifestToProject()` shows exactly which registry fields a manifest maps to.
