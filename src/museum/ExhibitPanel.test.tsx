import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ExhibitPanel } from "./ExhibitPanel";
import type { Exhibit, ExhibitContent } from "./world";

const panel = (content: ExhibitContent, mode: "developer" | "business" = "business") => {
  const exhibit: Exhibit = { id: "x", label: "X", verb: "View", x: 0, z: 0, radius: 1, content };
  const html = renderToStaticMarkup(<ExhibitPanel exhibit={exhibit} mode={mode} onClose={() => {}} />);
  return { html, text: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ") };
};

describe("ExhibitPanel", () => {
  it("shows one degree", () => {
    const { text } = panel({ type: "education", id: "iimb-bba-dbe" });
    expect(text).toContain("BBA, Indian Institute of Management Bangalore");
    expect(text).toContain("BBA Digital Business and Entrepreneurship");
    expect(text).not.toContain("REVA");
  });

  it("shows one published project in full", () => {
    const { text } = panel({ type: "project", id: "tasknest" });
    expect(text).toContain("TaskNest");
    expect(text).toContain("Key features");
    expect(text).not.toContain("FactCheckAI");
  });

  it("never shows details of an unfinished project, even if asked for one", () => {
    const { text } = panel({ type: "project", id: "factcheckai" });
    expect(text).toContain("This exhibit is still being prepared.");
  });

  it("never shows an unverified record, even if asked for one", () => {
    const { text } = panel({ type: "experience", id: "achivia-writing" });
    expect(text).not.toContain("ACHIVIA");
    expect(text).toContain("being prepared");
  });

  it.each([
    ["developer", "/images/portrait-pixel.png"],
    ["business", "/images/portrait.webp"],
  ] as const)("shows the owner's identity with the %s portrait", (mode, src) => {
    const { html, text } = panel({ type: "identity" }, mode);
    expect(html).toContain(`src="${src}"`);
    expect(html).toMatch(/alt="[^"]*Barsarani Sahoo/);
    expect(text).toContain("Barsarani Sahoo");
  });

  it("shows a notice's own text", () => {
    const { text } = panel({ type: "notice", title: "Skills", text: "This collection is being prepared." });
    expect(text).toContain("Skills");
    expect(text).toContain("This collection is being prepared.");
  });

  it("is a labelled dialog with a close button", () => {
    const { html } = panel({ type: "section", section: "contact" });
    expect(html).toMatch(/<dialog[^>]*aria-labelledby="exhibit-panel-title"/);
    expect(html).toContain('aria-label="Close exhibit"');
    expect(html).toContain("github.com/barsa-dot");
  });
});
