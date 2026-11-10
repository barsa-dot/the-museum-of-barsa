import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MuseumGuide, portfolioSectionHref } from "./MuseumGuide";

const render = (mode: "developer" | "business") =>
  renderToStaticMarkup(
    <MuseumGuide mode={mode} title="No 3D" reason="Testing" onExit={() => {}} currentUrl="https://museum.test/?mode=business&view=museum" />,
  );
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

describe("MuseumGuide (the museum without 3D)", () => {
  it.each(["developer", "business"] as const)("lists all seven spaces in %s mode", (mode) => {
    const t = text(render(mode));
    for (const name of ["The Grand Atrium", "The Library", "The Creation Wing", "The Archive", "The Workshop", "The Portrait Room", "The Courtyard"]) {
      expect(t).toContain(name);
    }
  });

  it("links rooms with verified content to the same content on the portfolio pages", () => {
    const html = render("business");
    expect(html).toContain('href="https://museum.test/?mode=business#education"');
    expect(html).toContain('href="https://museum.test/?mode=business#projects"');
    expect(html).toContain('href="https://museum.test/?mode=business#contact"');
  });

  it("says 'Being prepared' instead of linking to sections with nothing verified yet", () => {
    const html = render("developer");
    expect(html).not.toContain("#experience");
    expect(html).not.toContain("#skills");
    expect(text(html).match(/Being prepared/g)?.length).toBe(3); // Archive, Workshop, Portrait Room (no intro yet)
  });

  it("keeps the mode and leaves the museum view", () => {
    expect(portfolioSectionHref("https://x.test/?mode=developer&view=museum", "projects")).toBe("https://x.test/?mode=developer#projects");
  });

  it("never mentions unverified records", () => {
    expect(text(render("business"))).not.toMatch(/ACHIVIA|FastAPI/);
  });
});
