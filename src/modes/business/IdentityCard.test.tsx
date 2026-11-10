import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { profile, projects, viewFor, type Profile } from "../../data/profile";
import { ContentProvider } from "../../content/components";
import { App } from "../../app/App";
import { STORAGE_KEY, createModeStore } from "../../state/mode";
import { IdentityCard } from "./IdentityCard";

const render = (source: Profile) =>
  renderToStaticMarkup(
    <ContentProvider view={viewFor(source, projects, "business")}>
      <IdentityCard />
    </ContentProvider>,
  );

describe("IdentityCard", () => {
  it("shows the name as the page heading", () => {
    expect(render(profile)).toMatch(/<h1 id="biz-identity-name"[^>]*>Barsarani Sahoo<\/h1>/);
  });

  it("uses the owner's photograph", () => {
    const html = render(profile);
    expect(html).toContain('src="/images/portrait.webp"');
    expect(html).not.toContain("Photograph pending");
  });

  it("shows a clearly labelled placeholder if no photograph is configured", () => {
    const html = render({ ...profile, portrait: { photo: null, pixel: null } });
    expect(html).toContain("Photograph pending");
    expect(html).toContain('aria-label="Photograph placeholder. The photo has not been added yet."');
    expect(html).not.toContain("<img");
  });

  it("shows the real photograph once it is configured", () => {
    const withPhoto: Profile = {
      ...profile,
      portrait: {
        ...profile.portrait,
        photo: { src: "images/portrait.jpg", alt: "Photograph of Barsarani Sahoo", width: 800, height: 1000 },
      },
    };
    const html = render(withPhoto);
    expect(html).toContain('src="/images/portrait.jpg"');
    expect(html).toContain('alt="Photograph of Barsarani Sahoo"');
    expect(html).not.toContain("Photograph pending");
  });

  it("lists verified details with the BBA first in Business Mode", () => {
    const html = render(profile);
    expect(html.indexOf("Indian Institute of Management Bangalore")).toBeLessThan(html.indexOf("REVA University"));
    expect(html).toContain("Digital Business and Entrepreneurship");
    expect(html).toContain("Computer Science and Engineering");
    expect(html).toContain('href="https://github.com/barsa-dot"');
    expect(html).not.toContain("ACHIVIA");
  });

  it("shows the headline only once the owner supplies one", () => {
    expect(render(profile)).not.toContain("id-card__headline");
    const html = render({ ...profile, person: { ...profile.person, headline: "Writes and builds." } });
    expect(html).toContain('<p class="id-card__headline">Writes and builds.</p>');
  });

  it("never prints empty values", () => {
    expect(render(profile).replace(/<[^>]+>/g, " ")).not.toMatch(/\bnull\b|\bundefined\b/);
  });
});

describe("mode identity", () => {
  const page = (mode: string) =>
    renderToStaticMarkup(
      <App store={createModeStore({ storage: { getItem: (k) => (k === STORAGE_KEY ? mode : null), setItem() {}, removeItem() {} } })} />,
    );

  it("puts the identity card only in Business Mode", () => {
    expect(page("business")).toContain('class="id-card"');
    expect(page("developer")).not.toContain('class="id-card"');
  });

  it("no longer needs a hidden fallback heading", () => {
    expect(page("business")).not.toMatch(/<h1 class="visually-hidden"/);
  });
});
