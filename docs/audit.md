# Existing-site audit

Working notes from Phase 0 of the redesign.
Each section records what was verified, not what was assumed.

## 0.1 Repository and Git state (2026-11-06)

- Repository root `F:/projects/the-museum-of-barsa`, single branch `main`,
  one worktree, in sync with `origin/main` (github.com/barsa-dot/the-museum-of-barsa).
- Plain HTML, CSS and vanilla JavaScript. No `package.json`, package manager,
  build step, tests or 3D library.
- No `wrangler` config in the repo. README describes Cloudflare Pages, but the
  live site is on `*.workers.dev` (see 0.2).
- `images/` and `audio/` contain only `.gitkeep`.

## 0.2 Deployed experience vs repository (2026-11-06)

Live site: https://the-museum-of-barsa.barsa3520.workers.dev/

### Deployment

- Served by Cloudflare (`Server: cloudflare`). Every page, script, stylesheet and
  `projects.json` matches commit `8447075` byte-for-byte apart from line endings
  (the local checkout uses CRLF). The live site is the current `main`.
- Pretty URLs are on: `/index.html` redirects (307) and `/rooms/library` serves
  the room page.
- Unknown paths return 404 (not the SPA fallback the README describes).
- Repository files are public: e.g. `/README.md` is served as
  `text/markdown`, so every committed file can be opened on the live site.
- The README's Pages setup instructions and the `workers.dev` hostname disagree.
  Which Cloudflare product and dashboard settings deploy the site needs
  confirming with the owner (see 0.3/0.7).

### Experience, in visit order

1. **Intro** (`index.html#intro`): dark screen, large "THE MUSEUM OF BARSA"
   title, one-line subtitle, "ENTER THE MUSEUM" button. *Owner dislikes this;
   scheduled for removal in 2.1.*
2. **Entrance sequence** (CSS only): dark passage of arches → staircase descent →
   monumental doors open → walk through. Measured **≈17.5 s** on desktop before
   the atrium appears. Skip button (receives focus) and Escape both skip it;
   `prefers-reduced-motion` skips it entirely.
3. **Grand Atrium**: cream gradient hall, title "THE GRAND ATRIUM", "Choose a
   door to begin.", six arched door links in a row (3×2 grid on mobile). Focus
   moves to the atrium title on arrival. *Owner dislikes this: it is a
   door-selection menu, not a place you move through.*
4. **Room transition**: clicking a door zooms towards it and fades, then loads the
   room page, which fades in. Verified: atrium → `/rooms/library`. Reduced motion
   and Ctrl/Cmd/Shift-click fall back to a normal link.
5. **Rooms**: six static pages, each a header (back link, eyebrow, title, intro)
   and a grid of "exhibit" cards. Not spatial; ordinary scrolling pages.
6. **Corner controls** on every page: Quick view, Map, and a Sound toggle that
   hides itself because `audio/ambience.mp3` is missing (audio never autoplays).
7. **Map**: modal `<dialog>` floor plan of all seven rooms, current room marked
   "You are here", Escape/backdrop/× close it.
8. **Quick view** (`quick-view.html`): every section on one plain page;
   projects come from `projects.json`.

### Content actually published

| Area | Live state |
|---|---|
| Education | REVA B.Tech CSE and IIM Bangalore BBA DBE named; years, descriptions, achievements are `[TODO]` |
| Projects | TaskNest shown as a full "Now showing" exhibit (status `published`, no screenshots or limitations). FactCheckAI and Humanizer shown as sealed "Opening soon" doors |
| Experience | All five collections (work, writing, volunteering, events, leadership) are `[TODO]`; ACHIVIA not mentioned |
| Skills | All `[TODO]` |
| About | Name only; photo, one-liner, intro and interests are `[TODO]` |
| Contact | GitHub link works. Email, LinkedIn are `[TODO]`; resume link 404s |

`[TODO]` markers are visible to the public with a dashed outline.

### Broken or missing on the live site

- `resume.pdf`, `images/portrait.jpg`, `audio/ambience.mp3`, `favicon.ico` → 404.
- TaskNest is presented as finished without the publication checks
  required for a published project (audit in 5.3).

### Responsive behaviour

Checked with Chrome device emulation at 1440×900, 768×1024 and 390×844 on intro,
atrium, Library, Creation Wing, Portrait Room and Quick view:
no horizontal overflow, atrium wraps to a 3×2 grid, room cards stack to one
column, corner controls stay reachable. No JavaScript exceptions.

### What works and is worth preserving

- Reduced-motion handling, skip control and focus management.
- Accessible map dialog and the single `ROOMS` list it is built from.
- `projects.json` registry with status-driven rendering (`textContent`, no HTML
  injection) and the sealed-gallery idea for unpublished projects.
- Quick view as a non-3D, recruiter-friendly fallback.
- Opt-in audio with remembered preference.
- Seven-room structure and naming.

### What the owner dislikes

- The title-centric intro and ENTER THE MUSEUM button.
- The atrium as "choose a door and load a page" rather than a walkable place.

## 0.3 Current architecture (2026-11-06)

### Stack and delivery

- Static multi-page site: 8 HTML pages, 1 stylesheet (`style.css`, ~1450 lines),
  1 classic script (`museum.js`, ~530 lines), 1 data file (`projects.json`).
- No modules, bundler, framework, package manager, tests or 3D/WebGL code.
- External dependency: Google Fonts only (Cormorant Garamond, Inter), linked
  separately in every page `<head>`.
- Hosting: Cloudflare **Worker with static assets** (307 redirects strip `.html`;
  no `the-museum-of-barsa.pages.dev` project exists). No `wrangler` config in the
  repo, so it was configured in the Cloudflare dashboard. Whether pushes to
  `main` auto-deploy is unconfirmed — check *Workers & Pages → the-museum-of-barsa
  → Settings → Build*. The README's Pages section is out of date.

### Entry points and routing

| Page | Role |
|---|---|
| `index.html` | Intro, three entrance scenes, Grand Atrium (all in one document, toggled with `hidden`) |
| `index.html#atrium` | Same page; `museum.js` skips straight to the atrium |
| `rooms/*.html` (6) | One page per room; back link to `index.html#atrium` |
| `quick-view.html` | One-page plain summary of everything |

- Routing is ordinary page navigation. There is no client-side router.
- Root-relative paths (`/rooms/...`, `/projects.json`) mean the site must be
  served from a domain root.
- `pageId()` in `museum.js` normalises `/x.html` and `/x` so the map can mark the
  current room under pretty URLs.

### `museum.js` responsibilities (one shared script, feature-detected per page)

1. Entrance state machine: intro → passage → stairs → doors → atrium, driven by
   CSS `animationend`/`transitionend`; Skip button, Escape, reduced motion.
2. Corner controls injected on every page: Sound, Quick view, Map.
3. Map `<dialog>` generated from the `ROOMS` array (the only list of rooms in JS).
4. Opt-in looping audio (`/audio/ambience.mp3`), preference in `localStorage`,
   position in `sessionStorage`; button hides if the file 404s.
5. Zoom-and-fade page transitions for `a[data-transition]`, with bfcache restore.
6. Projects loader: `fetch('/projects.json')` → exhibit cards or sealed doors by
   `status`, built with `textContent`. Used by Creation Wing and Quick view.

### Styling and theme

- One stylesheet in 25 numbered sections (tokens, reset, base, reduced motion,
  intro, entrance scenes, atrium, transitions, controls/map, shared room styles,
  one section per room, sealed galleries, quick view, mobile, project details).
- Tokens in `:root`: 5 palette colours (`--charcoal`, `--ivory`, `--bronze`,
  `--sage`, `--mist`), 2 font stacks, a 5-step spacing scale, 1 easing, 2 durations.
- Tokens are only partly used: ~184 `var(--…)` references, but ~71 hard-coded hex
  values and ~51 `rgb/rgba()` literals outside `:root`. A second visual mode
  cannot be added by swapping tokens alone; colours need consolidating first.
- Per-room looks are `.room--<name>` modifiers. All scenery (arches, stairs,
  doors, room backdrops) is CSS gradients/shapes; CSS loads no image files.
- Breakpoints: `max-width: 480px`, `600px`; `min-width: 768px`, `900px`;
  `orientation: portrait`; `print`; `prefers-reduced-motion`.

### Data sources

| Content | Source |
|---|---|
| Projects | `projects.json` (structured, status-driven) |
| Rooms list (for map) | `ROOMS` array in `museum.js` |
| Atrium doors | Hard-coded in `index.html` (duplicates `ROOMS`) |
| Education, experience, skills, about, contact | Hard-coded HTML, **duplicated** in each room page and again in `quick-view.html` |

There is no single profile data model yet; only projects are data-driven.

### Asset loading

- Fonts: Google Fonts stylesheet with `display=swap`, preconnect on each page.
- Images: none shipped. Portrait expected at `images/portrait.jpg`
  (commented-out `<img>`); project screenshots lazy-loaded from `projects.json`.
- Audio: `preload="metadata"`, fetched on every page even though the file is missing.
- Resume: linked as `/resume.pdf` (missing).

### Implications for the redesign (evidence for 0.4)

- The planned walkable 3D museum and two visual modes need things the current
  stack doesn't have: a WebGL library, shared profile data, and a full token
  system. Choosing between (a) adding Three.js as an ES module with no build step
  and (b) introducing npm + Vite (with or without React) is the key stack
  decision for 0.4.
- Reusable as-is or with light changes: `projects.json` and its rendering rules,
  map dialog pattern, audio toggle, reduced-motion and focus handling,
  `pageId()` URL handling, Quick view as the non-3D fallback.

## 0.4 Implementation and preservation report (2026-11-06)

### Keep (reuse with little or no change)

| Item | Where | Why |
|---|---|---|
| Seven-room structure and names | `ROOMS`, room pages | Planned structure is identical |
| Project registry + status rendering | `projects.json`, `loadProjects()` | Basis for Phase 5/6; safe `textContent` rendering |
| Sealed "Opening soon" gallery | `buildSealedGallery()`, CSS §22 | Matches the rule that unfinished projects show no fake exhibit |
| Map dialog pattern | `museum.js` map, CSS §14 | Accessible `<dialog>`, current-room marker; extend into the floor plan |
| Opt-in audio toggle | `museum.js` audio | Never autoplays; hides when file is missing |
| Reduced-motion, skip, focus handling | `museum.js`, CSS §4 | Pattern to carry into new intros and 3D |
| `pageId()` pretty-URL handling | `museum.js` | Needed while served by Workers static assets |
| Quick view | `quick-view.html` | Becomes the non-3D / recruiter fallback (3.8) |
| Serif + sans pairing | Cormorant Garamond + Inter | Reasonable starting point for Business Mode typography |

### Improve

- **Content source:** education, experience, skills, about and contact are typed
  into HTML twice (room page + Quick view). Replace with one typed profile model
  (1.1) that every view renders from.
- **Theme system:** ~120 hard-coded colours. Consolidate into tokens, then define
  Developer and Business token sets (1.3).
- **Atrium:** door grid → walkable 3D atrium (3.4). Keep the door grid's links as
  the fallback navigation, not the main experience.
- **Rooms:** scrolling card pages → connected 3D spaces whose exhibits open
  readable HTML panels (3.5–3.6).
- **Room list duplication:** `ROOMS` in JS and doors in `index.html` → one list.
- **Placeholders:** `[TODO]` boxes are public. Hide empty fields until real
  content exists.
- **TaskNest:** shown as finished without the publication checks; no screenshots
  despite the commit message. Re-check in 5.3.
- **Docs:** README's Cloudflare Pages section doesn't match the Workers deployment.
- **Favicon:** missing (404 on every page).

### Remove

- Title intro screen and ENTER THE MUSEUM button (2.1).
- The ~17.5 s entrance sequence (passage → stairs → doors). It exists only to
  follow the intro, and the mode-selection screen replaces that entry. CSS §6–§11
  and the entrance state machine in `museum.js` go with it. *(Recommendation —
  confirm, see below.)*

### Stack recommendation

The plan needs a typed shared data model, a first-person WebGL world, two
art-directed modes and later manifest validation. The current no-build site
can't provide typed data or a maintainable 3D scene.

**Recommended: Vite + TypeScript + React + React Three Fiber/Drei, with Three.js.**

- Matches the owner's existing TaskNest stack (React 19, TS, Vite), so the code
  stays maintainable by the owner.
- TypeScript gives the single typed profile model (1.1) and compile-time checks
  that both modes receive the same records.
- R3F/Drei provide pointer-lock controls, lazy loading (`Suspense`) and
  performance helpers (`AdaptiveDpr`, instancing) suited to integrated graphics.
- The 3D bundle is code-split, so the mode screen and content load first and
  devices without WebGL never download it.
- Tailwind, GSAP etc. are **not** added up front — only if a later task needs them.

Rejected alternative: vanilla Three.js as an ES module with no build. Lighter,
but no type checking, no code splitting, and a hand-rolled UI layer for two
modes — more fragile as the site grows.

Deployment impact: Cloudflare would need a build (`npm ci && npm run build`)
and to serve `dist/` instead of the repo root. That is a dashboard change the
owner must make (or approve) before the first redesigned deploy.
Migration happens in place on `main`; the current site keeps working until the
new build replaces it.

### Inputs needed from the owner

**Needed before Phase 1–2 work can be accurate**
1. Approval of the stack recommendation above.
2. The two design reference images (dark terminal/pixel and cream editorial).
   They are not in the repository.
3. Confirmation that the whole entrance sequence (not only the title screen) can
   be removed.
4. Profile facts: degree years and short descriptions, academic achievements,
   ACHIVIA role/dates/what the work involved, other writing, volunteering,
   events, leadership, confirmed skills list, one-line description, short intro,
   interests.
5. Contact details to publish: email, LinkedIn URL.

**Needed later (tasks can proceed with placeholders)**
6. A real photograph (2.6) — layouts use a labelled placeholder until then.
7. `resume.pdf` (4.7).
8. Cloudflare deploy settings: whether pushes auto-deploy, and permission to
   change the build settings (7.7).
9. Whether to keep audio; if so, a track the owner has rights to.
10. Approval of each project's public status, starting with TaskNest (5.x).
