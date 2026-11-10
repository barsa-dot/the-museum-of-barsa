import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { profile, projects, viewFor, type Profile } from "../../data/profile";
import { ContentProvider } from "../../content/components";
import { App } from "../../app/App";
import { STORAGE_KEY, createModeStore } from "../../state/mode";
import { DeveloperHero } from "./DeveloperHero";

const render = (source: Profile) =>
  renderToStaticMarkup(
    <ContentProvider view={viewFor(source, projects, "developer")}>
      <DeveloperHero />
    </ContentProvider>,
  );

describe("DeveloperHero", () => {
  it("shows the name as the page heading", () => {
    expect(render(profile)).toMatch(/<h1 id="dev-hero-name"[^>]*>Barsarani Sahoo<\/h1>/);
  });

  it("uses the owner's pixel portrait", () => {
    const html = render(profile);
    expect(html).toContain('src="/images/portrait-pixel.png"');
    expect(html).not.toContain("Portrait pending");
  });

  it("shows a clearly labelled placeholder if no pixel portrait is configured", () => {
    const html = render({ ...profile, portrait: { photo: null, pixel: null } });
    expect(html).toContain("Portrait pending");
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Portrait placeholder. The photo has not been added yet."');
    expect(html).not.toContain("<img");
  });

  it("shows the real pixel portrait once it is configured", () => {
    const withPortrait: Profile = {
      ...profile,
      portrait: {
        ...profile.portrait,
        pixel: { src: "images/portrait-pixel.png", alt: "Pixel-art portrait of Barsarani Sahoo", width: 512, height: 512 },
      },
    };
    const html = render(withPortrait);
    expect(html).toContain('src="/images/portrait-pixel.png"');
    expect(html).toContain('alt="Pixel-art portrait of Barsarani Sahoo"');
    expect(html).not.toContain("Portrait pending");
  });

  it("describes the owner with verified facts only", () => {
    const html = render(profile);
    expect(html).toContain("Computer Science and Engineering · REVA University");
    expect(html).toContain("Digital Business and Entrepreneurship · Indian Institute of Management Bangalore");
    expect(html).toMatch(/<a href="https:\/\/github\.com\/barsa-dot" target="_blank" rel="noopener noreferrer">/);
    expect(html).not.toContain("ACHIVIA");
  });

  it("lists the B.Tech first in Developer Mode", () => {
    const html = render(profile);
    expect(html.indexOf("REVA University")).toBeLessThan(html.indexOf("Indian Institute of Management Bangalore"));
  });

  it("shows the headline only once the owner supplies one", () => {
    expect(render(profile)).not.toContain("dev-hero__headline");
    const html = render({ ...profile, person: { ...profile.person, headline: "Builds careful software." } });
    expect(html).toContain('<p class="dev-hero__headline">Builds careful software.</p>');
  });
});

describe("page headings", () => {
  const page = (mode: string) =>
    renderToStaticMarkup(
      <App store={createModeStore({ storage: { getItem: (k) => (k === STORAGE_KEY ? mode : null), setItem() {}, removeItem() {} } })} />,
    );

  it.each(["developer", "business"])("%s mode has exactly one h1, the owner's name", (mode) => {
    const h1s = [...page(mode).matchAll(/<h1[^>]*>([^<]*)<\/h1>/g)].map((m) => m[1]);
    expect(h1s).toEqual(["Barsarani Sahoo"]);
  });

  it("puts the hero only in Developer Mode", () => {
    expect(page("developer")).toContain('class="dev-hero"');
    expect(page("business")).not.toContain('class="dev-hero"');
  });
});
