# The Museum of Barsa

An interactive personal portfolio designed as a virtual museum.
Instead of scrolling through sections, visitors walk through rooms.

> It should feel like entering a world, not opening a website.

## The idea

Visitors arrive in the **Grand Atrium**. From there, each door leads to a
different room of the collection.

| Room | What it holds |
|---|---|
| Grand Atrium | Central hub with doors to every room and the museum map |
| The Library | Education |
| The Creation Wing | Projects |
| The Archive | Experience |
| The Workshop | Skills |
| The Portrait Room | About |
| The Courtyard | Contact and resume |

For visitors who want the short version, a **Quick view** page shows all content on
one plain page. Resume and contact links are always one click away.

## Look and feel

Stylised realism: about 70% realistic architecture and 30% dreamlike.
Limestone and travertine, dark wood, brushed bronze, reflective water,
warm sunlight and soft shadows. Calm and elegant.

## How it's built

- Plain HTML, CSS and vanilla JavaScript. No frameworks, no build step.
- Rooms are full-screen scenes with clickable hotspots for doors and exhibits.
- Moving between rooms uses a CSS zoom-and-fade transition.
- Projects are loaded at runtime from `projects.json`, so adding or publishing a
  project only means editing that file.
- Works on mobile, respects `prefers-reduced-motion`, and never auto-plays audio.

## Project structure

```
index.html        Grand Atrium
rooms/            one HTML file per room
images/           scene backgrounds, photo, screenshots
style.css         palette, fonts and styles
museum.js         transitions, map, hotspots, projects loader
projects.json     project registry
```

## Adding or updating a project

All projects live in `projects.json`. The Creation Wing reads this file when it
opens, so adding or publishing a project only means editing it. No code changes.

Each project is one object in the list, shown in the same order:

```json
{
  "id": "tasknest",
  "name": "TaskNest",
  "status": "published",
  "tagline": "One line shown under the name",
  "description": "A short paragraph about the project",
  "liveUrl": "https://...",
  "githubUrl": "https://github.com/...",
  "screenshots": [
    { "src": "images/tasknest-1.png", "alt": "What the screenshot shows" }
  ],
  "limitations": ["A known limitation"]
}
```

| Field | Notes |
|---|---|
| `id` | Short unique name, lowercase, no spaces |
| `name` | Shown as the exhibit title |
| `status` | `published`, `in-development` or `unavailable` (see below) |
| `tagline`, `description` | Text for the exhibit |
| `role`, `timeline` | Optional. Shown on one line under the tagline |
| `problem` | Optional. What the project is for, and for whom |
| `approach` | Optional. How it tackles that problem |
| `features` | Optional list, shown as "Key features" |
| `implementation` | Optional list. How it is built: architecture and notable engineering |
| `stack` | Optional list of technologies, shown as tags |
| `evidence` | Optional list of checkable proof: `{ "kind": "tests", "label": "216 unit tests pass", "url": "https://...", "checked": "2026-11-11" }`. `kind` is `tests`, `documentation`, `demo`, `repository`, `audit` or `other`; `url` and `checked` are optional |
| `liveUrl`, `githubUrl` | Leave as `""` to hide the link |
| `screenshots` | Images in `images/`, each `{ "src", "alt", "caption"? }`. Leave as `[]` for none |
| `limitations` | Honest notes on what it can't do yet. Leave as `[]` for none |
| `presentation` | Optional per-mode order and wording (`developer` / `business`: `summary`, `tags`, `priority`, `featured`) |
| `release` | Optional latest release: `{ "version": "1.2.0", "date": "2026-11-02", "notesUrl": "https://..." }` (`notesUrl` optional) |

Both modes show every part a project has; they only change the order
(Developer leads with implementation and stack, Business with features and
evidence). How the registry, project manifests (`museum-manifest.json`) and
publication approval fit together is in `docs/project-registry.md`.

The new app validates the file as it loads it, and its tests read the
real file, so a typo fails the tests instead of breaking the exhibit.

What each status shows:

- `published`: the full exhibit with tagline, description, links, screenshots and limitations.
- `in-development`: a sealed gallery door labelled "Opening soon". Only the name is shown.
- `unavailable`: the exhibit is shown with a "Temporarily closed" note.

To publish a project, fill in its fields and change its `status` to `published`.

## Running locally

No install needed. `fetch()` doesn't work from `file://`, so serve the folder
with any static server, for example:

```
python -m http.server
```

Then open http://localhost:8000.

Run the server from the project folder itself. Links such as `/rooms/library.html`
start with `/`, so the site expects to be served from the root of a domain.

## Deployment

Hosted on **Cloudflare Pages** (free plan), connected to this GitHub repository.
There is no build step: Cloudflare serves the files exactly as they are in the repo.

### First-time setup

1. Push the repository to GitHub.
2. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages →
   Connect to Git**, and choose this repository.
3. Use these build settings:

   | Setting | Value |
   |---|---|
   | Production branch | `main` |
   | Framework preset | None |
   | Build command | *(leave empty)* |
   | Build output directory | `/` |

4. Click **Save and Deploy**. The site goes live at
   `https://<project-name>.pages.dev`.

### Updating the site

Every push to `main` deploys automatically, usually within a minute.
Pushes to other branches get their own preview URL, which is useful for
checking a change before merging it.

To publish a project, edit `projects.json` (see
[Adding or updating a project](#adding-or-updating-a-project)), commit and push.

### Good to know

- **Pretty URLs:** Cloudflare serves `/rooms/library.html` as `/rooms/library`.
  Both work, and the museum map handles either form.
- **Missing pages:** without a `404.html` file, Cloudflare treats the site as a
  single-page app and shows `index.html` for any unknown address.
- **Everything in the repo is public:** files such as `README.md` can also
  be opened on the live site.
- **Custom domain:** can be added for free under the project's
  **Custom domains** tab.
