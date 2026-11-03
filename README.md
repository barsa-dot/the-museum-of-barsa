# The Museum of Barsa

An interactive personal portfolio designed as a virtual museum.
Instead of scrolling through sections, visitors walk through rooms.

> It should feel like entering a world, not opening a website.

## The idea

Visitors arrive at an intro screen, pass through a dark passage, descend a staircase
and step through a pair of monumental doors into the **Grand Atrium**. From there,
each door leads to a different room of the collection.

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
index.html        intro + entrance + atrium
rooms/            one HTML file per room
images/           scene backgrounds, photo, screenshots
style.css         palette, fonts and styles
museum.js         transitions, map, hotspots, projects loader
projects.json     project registry
```

## Running locally

No install needed. `fetch()` doesn't work from `file://`, so serve the folder
with any static server, for example:

```
python -m http.server
```

Then open http://localhost:8000.

## Deployment

Hosted on Cloudflare Pages (free plan). Deployment notes will be added later.
