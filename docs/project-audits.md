# Project audits (Phase 5)

Verified facts only. Each audit records what was inspected and run, what is
proved, and what is not. Nothing here is published on the portfolio until
the owner approves it (task 5.6).

## 5.1 Humanizer / Writing DNA (now "AuthorDNA") — audited 2026-11-11

**Source inspected:** local clone `F:\projects\Humanizer` (read-only; no
files changed, `git status` clean before and after).

| Item | Verified finding |
|---|---|
| Repository | `github.com/barsa-dot/Humanizer` (**private**: 404 to logged-out visitors, checked 2026-11-11), branch `main`. Local `HEAD` `751e92a` equals GitHub `main` (checked with `git ls-remote`). 71 commits on `main`, 2026-06-20 to 2026-11-10. |
| Product name | The README calls it **AuthorDNA**. The repository keeps the name Humanizer. The registry (`projects.json`) still says "Humanizer". |
| What it is | A web app that builds an explainable "Writing DNA" profile of how a person writes (sentence and paragraph patterns, vocabulary, word habits, punctuation, readability, labelled tone/narrative estimates) from up to 10 samples. Deterministic rules; no LLM or external API. |
| Implemented (per code, docs and tests) | V1 profile analysis; V2: saved profiles in the browser with `.authordna` export/import, **Voice Check** (draft vs saved profile, 0–100 drift score with reasons), **Voice Journey** (habit trends across dated samples, SVG charts). |
| Stack | Python, FastAPI, `textstat`; plain HTML/CSS/JS modules (no build step); Docker; Render Blueprint (`render.yaml`). |
| Tests (run by me) | Backend: **753 passed** (`pytest -W error`, 21 s). Browser (Playwright, Microsoft Edge, real server): **119 passed** (2 min). Both match the project's own status record. |
| Documentation | README, GETTING_STARTED, ARCHITECTURE, SCHEMA, METHODOLOGY, PRIVACY_SECURITY, DEPLOYMENT, TESTING, input policy, V2 spec, status log. Limitations are documented. |
| Deployment | **Not deployed.** Project docs say so; `https://authordna.onrender.com/api/health` returns 404 (the default name in its deploy guide). Docker image was run locally with Render's free-tier limits (per its TESTING.md, 2026-11-06; not re-run here). |
| Contribution | All 94 commits (all refs) are by `barsa-dot`; no co-author trailers. Sole committer. |
| Screenshots | None in the repository. The e2e suite can save them (`AUTHORDNA_E2E_SCREENSHOTS`). |
| Licence | None chosen; `LICENSE` is a placeholder. |

**Open items in the project's own records (not done):**

- Owner approval of `docs/METHODOLOGY.md` (formulas and judgement-call thresholds), and of the architecture/schema docs.
- Owner's manual test of Voice Check and Voice Journey; V1 never tried on real writing, only sample text.
- Release/deployment approval; no independent security review; no per-visitor rate limit.
- Licence.

**Documentation inconsistencies noticed (in the Humanizer repo, not fixed here):**

- README "Known limitations" says "No accounts or saved profiles", but V2 saves profiles in the browser (there are still no accounts).
- README "Out of scope for V1" lists "Writing drift detection", which V2's Voice Check now provides. The list is V1-only, but reads as current.

**Publication checklist (CLAUDE.md §5):**

| Requirement | State |
|---|---|
| Core functionality works; main features implemented | Yes (tests) |
| Relevant tests pass | Yes, re-run 2026-11-11 |
| Architecture and setup documented | Yes |
| Owner's contribution clear | Yes (sole committer) |
| Screenshots or working demo | **No** |
| README accurate | Mostly; two stale lines above |
| Limitations documented | Yes |
| Public claims verified | Claims above only |
| Owner approves publication | **No** |

**Status for the museum:** stays `in-development` (sealed "Opening soon"
door, name only). No change to `projects.json` in this task.

**Decisions for the owner:** display name (AuthorDNA, Humanizer, or
"AuthorDNA (formerly Humanizer)"); whether to deploy on Render first or
exhibit with screenshots and a GitHub link only; fixing the two stale README
lines.

## 5.2 FactCheckAI — audited 2026-11-11

**Source inspected:** local clone `F:\projects\FactCheckAI` (read-only;
`git status` clean before and after; the frontend test build was written
outside the repository and deleted).

| Item | Verified finding |
|---|---|
| Repository | `github.com/barsa-dot/FactCheckAI` (**private**), branch `main`. A separate public repository, `barsa-dot/Bolt-FactCheckAi`, exists and was not audited. Local `HEAD` `1b837ec` equals GitHub `main`. 57 commits, 2026-06-10 to 2026-07-21; no commits since. |
| What it is | A claim checker. A FastAPI backend (`POST /factcheck`) embeds the claim (`all-MiniLM-L6-v2`), classifies it with a saved classifier, retrieves the 10 most similar **labelled claims** from a ChromaDB store built from the LIAR and FEVER datasets, re-ranks them (semantic + keyword + entity match), adds labels from a claim-similarity graph, and averages these into a verdict and "truth score". A React/Vite/Tailwind frontend shows the result, a knowledge-graph view and a PDF report. |
| How verdicts work (important for any public wording) | The "evidence" is the dataset labels of similar past claims, not live sources. The verdict is a vote over those labels. It does not search the web or read source documents (`app/web_search.py` is an empty file). |
| Data pipeline | `training/` scripts: preprocessing, TF-IDF baseline, Random Forest, embedding classifier, ChromaDB build, knowledge/similarity graphs. Datasets are committed (`data/`, ~40 MB: LIAR 12,836 rows incl. headers; FEVER train/dev). |
| Evaluation | Training scripts print accuracy and a classification report, but **no results are recorded**: the notebook has no accuracy output and no file stores the figures. `BACKEND_ERROR_FIX.md` mentions "100% accuracy" / "90% accuracy" for entity extraction with no measurement behind them. No accuracy figure can be claimed. |
| Tests | **None with assertions.** `test_backend.py` and `app/test_engine.py` are print scripts. Running `test_backend.py` failed: the `.venv` has no packages installed (`No module named 'joblib'`); the other env, `venv`, points to a missing Python 3.14. I did not install anything. |
| Reproducibility | Trained models (`*.pkl`, ~41 MB) and the ChromaDB store (~34 MB) are git-ignored, so a fresh clone cannot run without re-running the training scripts; no documented order for that. `requirements.txt` is UTF-16. |
| Frontend | Builds with `vite build`. `tsc --noEmit` reports **46 type errors** (e.g. response fields `supporting_claims`, `graph_evidence` not in its types). Backend URL is hard-coded to `http://127.0.0.1:8000`. |
| Origin of frontend | `bolt_frontend/.bolt/` and its README show it was generated from a bolt.new template and then edited. |
| Unsupported claims in the frontend | Landing page says "VeritasAI", "99.7% accuracy", "analyzed millions of claims", "proprietary AI systems". None is supported by the code or data. The stats strip says "Top Evidence Retrieved: 3" while the engine retrieves 10. The checker page also holds hard-coded sample results with invented source "credibility" numbers. **None of this may be reused on the portfolio.** |
| Commit history vs code | Commit `a7a5b56` says "Replaced Random Forest with XGBoost", but the change only tunes the Random Forest; XGBoost is not used anywhere. The running app uses `embedding_classifier.pkl`, not the Random Forest. |
| Documentation | `BACKEND_SETUP.md`, `BACKEND_ERROR_FIX.md`; no root README, no architecture or limitations doc. |
| Deployment | **None.** No deploy config; frontend only talks to localhost. |
| Contribution | All 57 commits by `barsa-dot`; no co-author trailers. Frontend scaffold from bolt.new (above). |
| Screenshots | None. |

**Publication checklist (CLAUDE.md §5):** core pipeline exists but could
not be run here; no assertion tests; no recorded evaluation; setup not
reproducible from the repository; no README/limitations; no demo or
screenshots; frontend contains unsupported claims; not approved. **Fails
on most points.**

**Status for the museum:** stays `in-development` (sealed door, name only).
No change to `projects.json`.

**What would make it exhibitable (owner's call):** a README with an honest
description (verdicts come from labelled dataset neighbours), recorded
evaluation results on the LIAR/FEVER test splits, assertion tests,
reproducible model build, removal of the 99.7%/millions/VeritasAI copy and
sample results, fixing the type errors, and screenshots or a demo.

## 5.3 TaskNest — audited 2026-11-11

**Source inspected:** local clone `F:\projects\Task_er` (read-only; `git
status` clean before and after; the test build was written outside the
repository and deleted) and the live site.

| Item | Verified finding |
|---|---|
| Repository | `github.com/barsa-dot/Task_er` (**private**: the exhibit's "View code on GitHub" link gives visitors a 404, see 5.7), branch `main`. Local `HEAD` `fc4b7d4` equals GitHub `main`. 48 commits, 2026-10-30 to 2026-11-02. |
| What it is | A local-first student planner (React 19, TypeScript, Vite, Tailwind, Zustand, Dexie/IndexedDB, Supabase auth + sync with row-level security, PWA). |
| Tests (run by me) | `vitest run`: **216 passed** in 12 files. `tsc -b`: clean. `oxlint`: clean. `vite build`: succeeds. |
| Live demo | `https://mytasknest.pages.dev/` returns 200 with title "TaskNest" (Cloudflare Pages). Login is required to use it. |
| Registry claims spot-checked against code | 12 achievements (`src/lib/achievements.ts`), Todoist/CSV import, .ics import/export, 8-week insights, focus timer with idle detection, quick add parser, sync with conflict handling: all present. Stack list matches `package.json`. Timeline "Oct–Nov 2026" matches the commit dates. |
| Contribution | All 48 commits by the owner. "Solo developer" is consistent with the history. |
| Documentation | `PROJECT_FACTS.md` (detailed, measured, with 17 known limitations, §9). It is dated before the last two commits (both "delete all data" fixes). The **README is two lines**, with no setup instructions. |
| Limitations | Documented in `PROJECT_FACTS.md` §9 (e.g. whole-record last-write-wins sync, reminders only while open, no UI/E2E tests or CI, manual database schema steps, one large JS bundle). **The museum registry's `limitations` list is empty.** |
| Screenshots | **None**, in either repository. Commit `8447075` in this repo says "with screenshots" but added no image files; `projects.json` has `screenshots: []`. |
| Publication | Already `published` in `projects.json` and shown as a full exhibit, put there by the owner on 2026-11-03. |

**Publication checklist (CLAUDE.md §5):**

| Requirement | State |
|---|---|
| Core functionality works; main features implemented | Yes (tests, build, live site) |
| Relevant tests pass | Yes, re-run 2026-11-11 (unit only; no UI/E2E tests) |
| Architecture documented | Yes (`PROJECT_FACTS.md`) |
| Setup instructions in README | **No** (README is two lines) |
| Owner's contribution clear | Yes |
| Screenshots or working demo | Working demo yes; screenshots no |
| Limitations documented | In the project, yes; **in the museum exhibit, no** |
| Public claims verified | Yes, the registry text above |
| Owner approves publication | Yes (published 2026-11-03) |

**Status for the museum:** stays `published`; the claims shown are
accurate. Gaps to close in 5.4–5.6: show a short limitations list on the
exhibit (from `PROJECT_FACTS.md` §9, owner to pick), and add screenshots
when the owner supplies them. A README with setup steps is the owner's
call in the TaskNest repository.
