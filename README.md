# Barsarani Sahoo — Portfolio

One portfolio brings together Barsarani's business and technical work. The default view includes a draggable identity badge, education, projects, experience as it is verified, and contact links. The **Arcade** tab opens **Spark Run**, an original maze game with solo and local two-player play.

## Run locally

```sh
npm install
npm run dev
```

In the arcade, start with **Solo** or **Two players**. Use the arrow keys for player one and WASD for player two. In solo play either key set works. Use the direction pad for touch, and Pause or Escape to pause. Players collect sparks, avoid sentries, and share three lives in two-player mode.

`npm test` runs the test suite. `npm run build` writes the production site to `dist/`.

## Content

The shared profile is in `src/data/profile/profile.ts`. Projects are in `projects.json`. Publish only confirmed facts, links, and assets. See [the project registry guide](docs/project-registry.md) for status and metadata.
