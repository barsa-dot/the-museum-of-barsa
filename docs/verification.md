# Verification log

Browser checks run against the production build (`npm run build` +
`npx vite preview`) in headless Chrome, driven over the DevTools protocol.
Unit/component tests run with `npm test`.

## 2.7 Mode switching and entry transitions (2026-11-06)

25/25 checks passed, no console errors.

| Area | Checks |
|---|---|
| First visit | Chooser only; no mode applied |
| Choosing | Developer shows the hero, saves the choice, focuses the name |
| Switching | Business at the top of the page plays the card drop and settles; switching back shows the hero; the drop does not replay in the same session |
| Preferences | Reload keeps the last chosen mode; `?mode=` links win without overwriting the saved choice; "Show the mode choice again" clears it and focuses the chooser heading |
| Keyboard | Tab order is skip link → name → mode switch; Enter on the switch changes mode |
| Reduced motion | Business card appears settled with no skip button |
| Responsive | 1440, 1024, 768, 390 and 320 px in both modes: no horizontal overflow, header name and switch don't overlap, identity hero/card visible |

Earlier task-level checks (2.2–2.6) also covered: Escape/Skip ending the card
entrance, mode switch clickable during the drop, switching while scrolled
keeping the visitor on the same section, fonts loading, and portrait assets
loading with alt text in both modes.

## 3.1 First-person movement prototype (2026-11-06)

Dev server, headless Chrome with software WebGL (SwiftShader), 1280×800.
17/18 automated checks passed; the remaining one is a test-browser limit.

| Check | Result |
|---|---|
| Portfolio invitation opens the museum; `?view=museum` keeps `?mode=` | Pass |
| WebGL canvas renders; help panel lists controls; focus on museum heading | Pass |
| W walks at 3.2 m/s (measured with in-page timing) | Pass |
| D strafes; ← turns (keyboard-only look); ↓ walks back relative to facing | Pass |
| Cannot leave the test hall | Pass |
| Back to portfolio, browser Back/Forward, direct link in Business Mode | Pass |
| No console errors | Pass |
| Pointer lock on "Start exploring" | **Not testable automatically** — headless and off-screen Chrome refuse pointer lock ("root document … not valid for pointer lock") |

Covered instead:
- Unit tests: mouse movement only counts as look while the canvas holds the
  pointer lock; listeners are removed on exit.
- Browser: when the lock is refused, a status note appears and keyboard
  walking continues.
- **Manual check needed:** in a normal browser window, click "Start
  exploring", move the mouse to look around, press Esc to release.

Software-rendered frame rate: ~18–20 fps in headless SwiftShader (CPU only).
Real GPUs, including integrated graphics, will be faster; measured properly
in 7.3.

## 3.2 Mobile movement (2026-11-06)

Dev server, headless Chrome with emulated touch (real `touchStart/Move/End`
events), 390×844 portrait and 844×390 landscape. 13/13 checks passed.

| Check | Result |
|---|---|
| Touch devices get the joystick and touch-specific help; no mouse-capture button | Pass |
| Help doesn't cover the pad (portrait and landscape); "Got it" dismisses it | Pass |
| Pushing the pad up walks forward at about walking pace; releasing stops | Pass |
| Dragging elsewhere turns the view; tapping the scene doesn't try pointer lock | Pass |
| Walking and looking with two fingers at once | Pass |
| No horizontal overflow; desktop (mouse) shows no joystick | Pass |
| No console errors | Pass |

Unit tests cover the joystick maths (dead zone, analogue speed, rim clamp,
no diagonal speed-up). **Worth confirming on a real phone** — emulated touch
doesn't capture thumb ergonomics.

## 3.3 Collisions and interactions (2026-11-06)

Dev server, headless Chrome (software WebGL). 24/24 checks passed; the 3.2
touch suite was re-run after these changes: 13/13.

| Check | Result |
|---|---|
| Pillar stops the visitor in front of it; hall walls keep them inside | Pass |
| Walking diagonally into a wall slides along it | Pass |
| No prompt from a distance; prompt appears near and facing an exhibit; disappears when turning away | Pass |
| Exhibits are solid (visitor stays in front) | Pass |
| Help steps aside after walking so it can't cover the prompt; "Controls" brings it back | Pass |
| E opens a modal panel with the verified education records; focus moves into it | Pass |
| Movement keys do nothing while open; Esc and Close close it; focus returns; walking resumes | Pass |
| Prompt is a real button (click/keyboard); touch shows "Tap to view" and tapping opens the panel; joystick hides while open | Pass |
| Museum top bar fits at 390 and 320 px | Pass |
| No console errors | Pass |

Unit tests: collision (stops at walls, no tunnelling at huge steps, slides,
round pillars, inside corners, doorways, gaps narrower than the player),
interaction (range, facing, nearest).

Test method note: positions are set with a development-only `place()` hook
before interaction checks, because walking routes depend on frame timing in
software rendering. Collisions and movement themselves are tested with real
key and touch input. The hook is not in production builds.

## 3.4 Grand Atrium (2026-11-06)

Dev server, headless Chrome (software WebGL), both modes. 11/11 browser
checks; 15 layout unit tests.

| Check | Result |
|---|---|
| Arrives in the Grand Atrium; location label updates ("Entrance: The Library") | Pass |
| Walking west through the Library doorway enters its entrance hall | Pass |
| "Visit" prompt inside the entrance hall opens the Library's education content | Pass |
| Entrance hall's closed end, pool rim and columns are solid | Pass |
| Walking back returns to the atrium | Pass |
| No console errors | Pass |

Layout unit tests: six entrances; start in open floor; **every room reachable
from the start through its doorway using the real collision rules**; visit
prompts only at the end of each entrance hall; columns kept off every route
to a door; **clear sightline from the start to the north doorway past the
monolith**.

Composition fixes made after reviewing screenshots: start moved off-centre
(monolith hid the north doorway) and further back (a column filled a third of
the view).

Frame rate in software rendering (CPU-only SwiftShader): ~8 fps with the full
atrium. Not representative of real GPUs; to be measured on the owner's
laptop in 7.3. Museum bundle: 251 KB gzip (Vite warns it is >500 KB before
compression); portfolio bundle unchanged at 78 KB.

## 3.5 Physical room connections (2026-11-06)

Dev server, headless Chrome (software WebGL). 8/8 walkthrough checks with
real key presses; 15 floor-plan unit tests.

| Walk (location label recorded at every step) | Result |
|---|---|
| Atrium → Corridor to The Creation Wing → The Creation Wing | Pass |
| The Library → Gallery: Library ↔ Archive → The Archive | Pass |
| The Archive → Corridor to The Archive → Grand Atrium (a loop) | Pass |
| Atrium → Walkway to The Courtyard → The Courtyard (open air) | Pass |
| Room plinth offers the room's verified content; far walls are solid | Pass |
| No console errors | Pass |

Unit tests: every room reachable on foot from the start via its corridor;
both galleries connect their rooms directly; walking hard in all four
directions inside every room, corridor and gallery never leaves the plan;
wall pieces leave doorways with lintels; the Courtyard is open-air.

Fixed during verification: doorways (wall thickness) belonged to no named
space, so the location briefly fell back to "Grand Atrium" — it now keeps
the last known place. Developer-mode rooms were too dark: added one soft
ceiling light per indoor room, lighter 3D wall tone and glowing baseboards.

Render cost (from the renderer): 58 draw calls / ~5,100 triangles at the
atrium start view; ~12 calls / ~1,800 triangles inside a room. Walls,
floors, ceilings and baseboards are each one instanced mesh.

## 3.6 Room environments (2026-11-07)

Dev server, headless Chrome (software WebGL), both modes. 28/28 browser
checks; 20 exhibit/placement and 8 panel unit tests.

| Room | What's there (verified data only) | Browser check |
|---|---|---|
| Library | A framed board per degree, left to right in mode order (B.Tech first in Developer, BBA in Business); bookcases | Prompt + panel with that one degree |
| Creation Wing | TaskNest on a stand; sealed "Opening soon" doors for FactCheckAI and Humanizer (name only, no prompt) | Stand opens the full project; sealed doors offer nothing |
| Archive | Honest "being prepared" notice (experience not yet confirmed); filing cabinets | Notice panel; no ACHIVIA text anywhere |
| Workshop | Honest notice (skills not yet confirmed); workbench and pegboard | Notice panel |
| Portrait Room | Real portrait, framed (pixel art in Developer, photograph in Business) with name plaque; bench | Identity panel with the right image, loaded |
| Courtyard | Contact signpost (GitHub); planters, trees, bench | Contact panel |

Unit tests: every verified record gets an exhibit in both modes; unfinished
projects are name-only and not interactive; unverified records appear
nowhere (not even on plaques); confirming records adds them automatically;
exhibits sit inside their rooms; every viewing spot is clear and reachable
(grid path search, itself tested to detect blocked routes); prompts appear
at each spot; furniture keeps clear of room centres and doorways. Panels
refuse to show unfinished projects or unverified records even if asked.

Fixed during verification: 3D faces (plaques, screens, portrait) rendered
blank because a material created before its texture loaded never shows it —
materials are now recreated when textures arrive. Wall boards read right to
left facing the wall — now left to right. The signpost's post showed through
its board — board moved forward.

Render cost in a furnished room: ~14 draw calls / ~1,700 triangles.

## 3.7 Orientation and quick navigation (2026-11-07)

Dev server, headless Chrome, both modes plus 390 and 320 px. 33/33 browser
checks; 17 unit tests.

| Check | Result |
|---|---|
| Map opens from the Map button and the M key; focus moves into it | Pass |
| Map shows the current location, the floor plan (7 spaces) and a you-are-here marker with facing | Pass |
| Walking is paused while the map is open | Pass |
| "Go to" a room places the visitor just inside it; walking resumes | Pass |
| The current room is marked in the list; "Back to the Grand Atrium" works | Pass |
| Shortcuts open Projects (TaskNest + "Opening soon" doors) and Contact directly | Pass |
| Resume shortcut says "Not yet available" (no resume file supplied) | Pass |
| Esc closes map/panels and focus returns | Pass |
| 390/320 px: museum bar fits (location wraps to its own row); map fits | Pass |
| No console errors | Pass |

Unit tests: every Go-to spot is inside its room and clear of all colliders
in both modes; shortcuts never link to a missing resume and link once one
is supplied.

## 3.8 Non-3D fallback (2026-11-07)

Headless Chrome, including one launched with WebGL disabled
(`--disable-webgl --disable-3d-apis`). 13/13 browser checks; 6 unit tests.

| Check | Result |
|---|---|
| WebGL off: the museum guide replaces the 3D view (all 7 spaces, no canvas, no Map/Controls) | Pass |
| Guide links keep the mode and point at portfolio sections; following one lands on that section | Pass |
| Rooms with nothing verified say "Being prepared" instead of linking | Pass |
| Guide fits a 390 px phone | Pass |
| Graphics context lost mid-visit (simulated with WEBGL_lose_context): guide shown, not a black screen | Pass |
| Map quick access covers all six sections and the resume status | Pass |
| Help explains the no-walking route | Pass |
| No unexpected console errors | Pass |

Also: a render error inside the 3D view is caught by SceneBoundary and shows
the guide (not exercised in the browser — it needs a deliberate crash).

Fixed during verification: links to a portfolio section (…#education)
opened at the top of the page, because the browser tried to scroll before
the app rendered the section. The app now scrolls after rendering. This
also fixes shared links to sections generally.

## 3.9 End-to-end exploration (2026-11-07)

Complete journeys with real input, plus every earlier suite re-run against
the current code.

| Run | Where | Result |
|---|---|---|
| A. Desktop journey: portfolio → museum; walk Atrium → Corridor → Library with W; reach and open the B.Tech board (E); walking paused while open; far wall stops; → turns; map → Creation Wing; walk to TaskNest and open it; stand is solid; map → atrium; pool rim stops; back to portfolio | Dev server | 15/15 |
| B. Touch journey: dismiss help by tapping; tap Map; tap a room; joystick walks to the first board; tap the prompt to open it; no overflow | Dev server, 390×844 | 7/7 |
| C. Production journey (visible interface only, no test hook): enter from the portfolio; map; walk to TaskNest with real keys and open it; quick access to About; back to portfolio | Production build | 8/8 |
| 2.7 mode switching and identity reveals | Production build | 25/25 |
| 3.2 touch · 3.5 corridors · 3.6 rooms · 3.7 map · 3.8 fallback | Dev server | 13/13 · 7/7 · 28/28 · 33/33 · 13/13 |

Found and fixed: on a phone in landscape the touch help no longer fit the
screen (it grew in 3.7/3.8); it now fits and scrolls if needed.

Test fixes (not app bugs): journeys now wait for results instead of fixed
delays (rendering runs at ~3–6 fps in software); taps scroll the target into
view first, as a visitor would; scripts select the Controls button by its
label (the Map button now comes first); the 3.5 suite no longer expects the
stand-in plinths replaced in 3.6.

Still manual: mouse-look under pointer lock (automated browsers refuse it)
and a check on a real phone.

## 4.1 Developer Mode visual direction (2026-11-07)

Dev server, headless Chrome. 11/11 visual checks; 4 unit tests; the 2.7 mode
suite re-run after the header change (25/25).

| Check | Result |
|---|---|
| Tabs list exactly the sections on the page, in order; a tab jumps to its section below the sticky header | Pass |
| Sections carry a `> ls ~/…` prompt; cards a numbered file label (`[1] projects/tasknest/README.md`) | Pass |
| Scanlines and the status line are on in Developer Mode | Pass |
| Business Mode gets none of the terminal decoration (but does get the tabs) | Pass |
| No horizontal overflow at 1440, 390 and 320 px (tabs scroll inside their bar) | Pass |
| No console errors | Pass |

Decorative generated text (prompts, file labels, brackets, `#` markers) uses
CSS alternative text `/ ""` so screen readers don't read it out. Words on the
page are unchanged, so the content-parity tests still hold.

## 4.2 Business Mode visual direction (2026-11-07)

Dev server, headless Chrome. 10/10 checks.

| Check | Result |
|---|---|
| Sections numbered in a circle, serif capitals with a burgundy full stop and rule segment | Pass |
| Entries carry large light numerals (featured one in burgundy) on hairline rules | Pass |
| Projects get a film-frame poster with their name; details beside it on desktop, below on phones | Pass |
| Paper grain and a colophon are on; tabs numbered in small caps | Pass |
| Developer Mode keeps its own look (no Business styles leak) | Pass |
| No horizontal overflow at 1440, 390 and 320 px; no console errors | Pass |

All decorative generated text is silent to screen readers (`/ ""`); content
is unchanged, so the parity tests still hold.

## 4.3 Mode-aware room presentation (2026-11-07)

Same rooms, exhibits and content in both modes; architecture, materials and
exhibit presentation differ. Checked by screenshots of the atrium, Library,
Portrait Room and Creation Wing in both modes; 3 unit tests; exploration
journeys re-run (22/22).

| Element | Developer | Business |
|---|---|---|
| Floors | Glowing grid (texture repeats per 2 m) | Stone tiles with fine joints |
| Walls | Lit crown line + glowing baseboards ("wireframe") | Dado and picture rails, dark skirting |
| Atrium columns | Lit rings | Square plinths and capitals |
| Wall exhibits & portrait | Dark monitor bezel with a glowing edge | Deep frame with a paper mat |

Render cost: atrium start ~77 draw calls / ~8,800 triangles (Developer),
~78 / ~7,100 (Business); a room ~18 calls / ~2,300–2,700 triangles.

## 4.4 Education complete in both modes (2026-11-07)

14 cross-surface tests (both modes, real profile and a profile with years and
descriptions filled in).

| Surface | Developer | Business |
|---|---|---|
| Identity (hero / card) | Both degrees, B.Tech first | Both degrees, BBA first |
| Education section | Both; B.Tech highlighted (lit border, `*` marker) | Both; BBA highlighted (burgundy numeral, larger title) |
| Museum Library | Both boards, B.Tech on the left | Both boards, BBA on the left |
| Portrait Room identity panel | Both named | Both named |
| Map quick access / no-3D guide | Education reachable | Education reachable |

Once years and descriptions are supplied they appear on the identity and in
the section in both modes (tested with sample values). Still needed from the
owner: degree years, short descriptions, any academic achievements.

## 4.5 Experience and achievements in both modes (2026-11-09) — built, waiting for records

No experience or achievement is verified yet, so nothing new is public. The
behaviour was checked with clearly fake test-only records
(`src/test/sampleRecords.ts`, never imported by the app).

| Check | Result |
|---|---|
| Both modes get the same records; only the order differs | Pass |
| Experience order by type: Developer work → leadership → writing → events → volunteering; Business work → writing → volunteering → events → leadership | Pass |
| Achievement order: Developer certifications first; Business awards first | Pass |
| Portfolio page lists every record, grouped in that order | Pass |
| Museum: every experience record on an Archive wall (7 places on 3 walls); achievements on the Library's south and east walls | Pass |
| More records than wall space: the last board reads "N more" and opens the full list — nothing is hidden | Pass |
| Boards clear of every doorway and of each other; viewing spots clear and reachable (also with every slot filled) | Pass |
| Achievements reachable without walking (map quick access) and from the no-3D guide, once any exist | Pass |
| Today: Archive still shows its honest notice; no empty Achievements shortcut | Pass |

Not yet seen in the browser with records (needs real verified records).

## 4.6 Skills in both modes (2026-11-09) — built, waiting for confirmed skills

Skills now fall into two families: **Technical skills** (languages,
frameworks, data, tools) and **Broader capabilities** (business,
communication). Developer lists technical first; Business lists broader
first. Both families always appear when they have records.

| Check | Result |
|---|---|
| Every category belongs to exactly one family | Pass |
| Every verified skill shown in both modes, same set | Pass |
| Family headings in the mode's order (Developer `// technical skills`, broader dimmed; Business italic serif subheads) | Pass |
| Workshop: one board per family in mode order, at most four lines ("and 7 more" when long), opening the full list | Pass |
| Only one family verified: no empty heading or board | Pass |
| Today: Workshop notice, no Skills section | Pass |

Tested with the candidate skills marked verified *in tests only*, plus two
fake broader capabilities. Nothing is public until the owner confirms.

## 4.7 Resume and contact access (2026-11-09) — built, waiting for details

- Header shortcut **Contact** in both modes (desktop, 390 px, 320 px): visible,
  36 px+ tap target, lands on the Contact section below the sticky header.
  Browser check 19/19, no console errors.
- **Resume** shortcut appears in the header, Contact section and museum quick
  access as soon as a file is configured (tested with a sample path); today
  it is absent / "Not yet available". A test fails if a configured resume
  file is missing from `app/public`.
- Email and LinkedIn appear in the Contact section and the Courtyard sign
  once supplied (tested with sample values).
- `https://github.com/barsa-dot` checked live: HTTP 200.

Unit tests: 375 pass; typecheck clean; build OK.

Still needed from the owner to finish 4.5–4.7: experience records (ACHIVIA
role, dates, one-line description; any other work, writing, volunteering,
events, leadership), achievements (if any), confirmed skills and broader
capabilities, email address to publish, LinkedIn URL, and `resume.pdf`.

## 2.8 Entrance animation removed (2026-11-10)

Owner decision: remove. The dormant passage → stairs → doors sequence, its
Skip button, `playEntrance()`/`finishEntrance()` in `museum.js` and CSS
sections 8–11 (plus the portrait-door rule and the atrium's fade-in start
state) were deleted from the old root site. The new app never used it.

| Check (headless Chrome, 1280×800 and 390×844, normal and reduced motion) | Result |
|---|---|
| Atrium visible at once (opacity 1, no transform) | Pass |
| Six room doors present; no entrance markup left | Pass |
| Map opens; first door leads to the Library | Pass |
| No script errors | Pass |

`node --check museum.js` OK. App unit tests 375 pass; typecheck clean.
