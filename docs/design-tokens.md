# Design tokens

Source of truth: `src/design/tokens.ts`. CSS mirror: `src/styles/tokens.css`
(apply with `<html data-mode="developer">` or `"business"`). Tests in
`src/design/tokens.test.ts` keep the two in sync and check contrast.

Both modes define the same token names; only values differ.

## Where the colours come from

Sampled from the owner's reference images (kept privately in `docs/`, not
published):

| Mode | Sampled | Used for |
|---|---|---|
| Developer | `#050906`–`#090B0A` | `bg` `#070A08` |
| Developer | `#09120D`–`#0C1411` | `surface` / `surfaceRaised` |
| Developer | `#1C2B24` | `border` |
| Developer | `#C4F3D5` (pixel display type) | `heading` |
| Developer | `#33D39D` (button fill) | `accent` `#3DD39E` |
| Business | `#F5EAD9` | `bg` `#F4EAD8` |
| Business | `#FBF1E6` | `surface` |
| Business | `#E5DBCB` | `border` |
| Business | `#1D1C1A` | `text` / `borderStrong` |
| Business | `#241D13` (film frame) | `frame` `#1F1A14` |
| Business | `#873F40` (red dot after "PROJECTS.") | `accent` |

Adjusted for accessibility: Developer `borderStrong` uses `#477C5C` (the plan's
secondary green) because the darker sampled border was only 2.05:1 against the
background.

## Contrast (enforced by tests)

- Text, muted text, headings and accent on every background: WCAG AA 4.5:1.
- Text on accent fills: 4.5:1.
- Focus ring and strong borders: 3:1.

## Typography

| Role | Developer | Business |
|---|---|---|
| Display | Silkscreen (pixel), headings only | Playfair Display |
| Heading | JetBrains Mono | Playfair Display |
| Body | JetBrains Mono | Source Serif 4 |
| Label | JetBrains Mono, tracking 0.04em | Inter, uppercase, tracking 0.14em |

Pixel type is never used for body text (tested). Fonts are not loaded yet; that
happens when the app shell is set up. Fallback stacks keep layouts usable.

## Shape, effects, motion

- Developer: 2–4px radii, hairline outline instead of drop shadow, faint mint glow
  for raised items, scanline overlay at 4%.
- Business: square corners, soft paper shadows, paper grain at 5%.
- Shared: 4px spacing scale, fluid type scale, three durations and three easings
  (no bounce/overshoot). Reduced-motion users get 1ms durations.
