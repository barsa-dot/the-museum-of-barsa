# The Museum of Barsa — Project Guide

An interactive personal portfolio designed as a virtual museum. Visitors explore rooms instead of scrolling sections.
Guiding principle: **it should feel like entering a world, not opening a website.**

## Hard constraints
- **Free only.** Hosted on Cloudflare Pages (free plan). No paid services, APIs, or libraries.
- **Keep it simple.** Plain HTML, CSS and vanilla JavaScript. No frameworks, no build step, no 3D engines (no Three.js, no React).
- **No auto-playing audio.** Music is optional and toggled by the user.
- Must work well on mobile (tap navigation) and load fast on mid-range phones.
- Never invent project features or claims. Only show what is in `projects.json`.

## Visual direction
Stylised realism / architectural adventure: about 70% realistic architecture, 30% dreamlike.
Materials: limestone/travertine, dark wood, brushed bronze, reflective water.
Atmosphere: warm sunlight, soft shadows, high ceilings, calm and elegant. Not a video game, not sci-fi, not a glowing dark-mode dev template.

Palette (define as CSS variables in `style.css`):
| Name | Hex | Use |
|---|---|---|
| Charcoal | #242522 | Dark backgrounds |
| Warm ivory | #E8DDC9 | Main surfaces |
| Muted bronze | #A88A66 | Accents |
| Sage | #829486 | Natural details |
| Mist | #B9C6C0 | Atmosphere |

Fonts: an elegant serif for headings (e.g. Cormorant Garamond from Google Fonts) and a clean sans for body text.

## How browsing works
- Each room is a full-screen scene (background image + warm overlay in the palette).
- Doors and exhibits are clickable hotspots positioned over the scene.
- Moving between rooms = smooth CSS zoom-and-fade transition, so it feels like walking through.
- A map button (always visible) opens a museum map; clicking a room goes straight there.
- A "Quick view" link shows all content on one plain, recruiter-friendly page.
- Resume and contact links are always reachable within one click.

## Entrance sequence
1. Intro screen: "THE MUSEUM OF BARSA" / "A collection of things I've learned, created and discovered." / button "ENTER THE MUSEUM".
2. Dark passage → staircase descent → monumental doorway → doors open → Grand Atrium revealed.
Pure CSS/JS animation. Include a "Skip" option. Respect `prefers-reduced-motion`.

## Rooms
1. **Grand Atrium** — central hub, doors to every room, access to map.
2. **The Library — Education**: REVA University (B.Tech CSE), IIM Bangalore (BBA Digital Business and Entrepreneurship), achievements.
3. **The Creation Wing — Projects**: rendered from `projects.json`.
4. **The Archive — Experience**: work, writing, volunteering, events, leadership.
5. **The Workshop — Skills**: languages, technologies, tools.
6. **The Portrait Room — About**: real photograph (placeholder until supplied), introduction, interests. Name and intro visible without clicking.
7. **The Courtyard — Contact**: email, GitHub, LinkedIn, resume download.

Use clearly marked placeholder text (e.g. `[TODO: add ...]`) where personal content is not yet provided. Do not make up details.

## Projects system
All project data lives in `projects.json`. The Creation Wing reads it at runtime with `fetch()`.
- `"status": "published"` → full exhibit: tagline, description, live link, GitHub link, screenshots, limitations.
- `"status": "in-development"` → sealed gallery door labelled "Opening soon". No feature list.
- `"status": "unavailable"` → exhibit shown with a "Temporarily closed" note.
Adding or publishing a project must only require editing `projects.json`. No code changes.

Currently: **TaskNest** is deployed (published). **FactCheckAI** and **Humanizer** are in development.
Excluded for now: Vedic AI / GYan-AI, Surface Studio, Arcade2.0, NewsByte, Kisan-Net.

## File structure
```
index.html        intro + entrance + atrium
rooms/            one HTML file per room
images/           scene backgrounds, photo, screenshots
style.css
museum.js         transitions, map, hotspots, projects loader
projects.json
```

## Deployment
Push to GitHub → Cloudflare Pages connected to the repo. Build command: none. Output directory: `/`.

## Git workflow
- **Do not run `git commit` or `git push` yourself.** I write and make all commits myself.
- Work on one task from the plan at a time, then stop. Do not start the next task until I ask.
- After each task, briefly explain what you changed and why, so I understand the code.
- Do not write personal content (bio, education, experience, project descriptions). Leave `[TODO]` placeholders; I write these myself.
- Keep changes small and readable. Prefer simple code I can explain in an interview over clever code.
- The commit messages below are a guide; I may reword them.

### Commit plan (target: 24 commits)
Setup
1. `chore: initialise project structure and .gitignore`
2. `docs: add README with project vision`
3. `style: add colour palette, fonts and base styles`

Intro and entrance
4. `feat: add intro screen with title and enter button`
5. `feat: add dark passage scene to entrance sequence`
6. `feat: add staircase descent animation`
7. `feat: add monumental doors opening animation`
8. `feat: add skip button and reduced-motion support`

Atrium and navigation
9. `feat: build Grand Atrium scene with room doors`
10. `feat: add zoom-and-fade room transitions`
11. `feat: add museum map with direct room navigation`
12. `feat: add optional user-controlled audio toggle`

Rooms
13. `feat: add Library room with education exhibits`
14. `feat: add Archive room for experience`
15. `feat: add Workshop room for skills`
16. `feat: add Portrait Room with photo placeholder and intro`
17. `feat: add Courtyard room with contact and resume links`

Projects
18. `feat: add projects.json registry with status field`
19. `feat: render Creation Wing exhibits from projects.json`
20. `feat: add sealed "Opening soon" galleries for in-development projects`
21. `feat: add TaskNest exhibit with screenshots and links`

Polish and launch
22. `feat: add recruiter Quick view page`
23. `fix: improve mobile layout and tap navigation`
24. `docs: add Cloudflare Pages deployment notes to README`

Later commits (as projects are completed) come naturally, e.g. `feat: publish FactCheckAI exhibit`.