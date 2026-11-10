// Education must be complete in both modes, on every surface: both degrees,
// the mode's emphasis (B.Tech leads in Developer, BBA in Business), and any
// details the owner adds (years, descriptions) appear everywhere at once.

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MODES, profile, projects, viewFor, type Mode, type Profile } from "../data/profile";
import { ContentProvider, ProfileContent } from "./components";
import { DeveloperHero } from "../modes/developer/DeveloperHero";
import { IdentityCard } from "../modes/business/IdentityCard";
import { buildExhibits } from "../museum/scene/exhibits";
import { ExhibitPanel } from "../museum/ExhibitPanel";
import { MuseumGuide } from "../museum/MuseumGuide";
import { recruiterShortcuts } from "../museum/navigation";

const BTECH = "Computer Science and Engineering";
const BBA = "Digital Business and Entrepreneurship";
const LEAD: Record<Mode, string> = { developer: BTECH, business: BBA };
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const order = (t: string) => (t.indexOf(BTECH) < t.indexOf(BBA) ? [BTECH, BBA] : [BBA, BTECH]);

const detailed: Profile = {
  ...profile,
  education: profile.education.map((e) => ({
    ...e,
    dates: e.id === "reva-btech-cse" ? { start: "2021", end: "2025" } : { start: "2024", end: "present" },
    description: `About the ${e.qualification}.`,
  })),
};

function surfaces(source: Profile, mode: Mode) {
  const view = viewFor(source, projects, mode);
  const wrap = (node: React.ReactNode) => text(renderToStaticMarkup(<ContentProvider view={view}>{node}</ContentProvider>));
  const panel = (content: Parameters<typeof ExhibitPanel>[0]["exhibit"]["content"]) =>
    text(renderToStaticMarkup(<ExhibitPanel exhibit={{ id: "x", label: "x", verb: "View", x: 0, z: 0, radius: 1, content }} mode={mode} onClose={() => {}} />));
  return {
    identity: wrap(mode === "developer" ? <DeveloperHero /> : <IdentityCard entrance="none" />),
    section: wrap(<ProfileContent />),
    libraryBoards: buildExhibits(view).filter((s) => s.room === "library").map((s) => s.plaque.title),
    portraitPanel: panel({ type: "identity" }),
    quickAccess: recruiterShortcuts(view).find((s) => s.id === "education"),
    guide: renderToStaticMarkup(<MuseumGuide mode={mode} title="t" reason="r" onExit={() => {}} currentUrl="https://x.test/" />),
    view,
  };
}

describe.each(MODES)("education in %s mode", (mode) => {
  const s = surfaces(profile, mode);

  it("shows both degrees on the identity, in the mode's order", () => {
    expect(s.identity).toContain(BTECH);
    expect(s.identity).toContain(BBA);
    expect(order(s.identity)[0]).toBe(LEAD[mode]);
  });

  it("lists both degrees in the Education section, leading with the mode's degree", () => {
    expect(order(s.section)[0]).toBe(LEAD[mode]);
    const featured = s.view.education.find((e) => e.presentation?.[mode]?.featured);
    expect(`${featured?.field}`).toBe(LEAD[mode]);
  });

  it("hangs both degrees in the museum Library, in the mode's order", () => {
    expect(s.libraryBoards).toEqual(mode === "developer" ? [BTECH, BBA] : [BBA, BTECH]);
  });

  it("names both degrees in the Portrait Room identity panel", () => {
    expect(s.portraitPanel).toContain(BTECH);
    expect(s.portraitPanel).toContain(BBA);
  });

  it("reaches education without walking (quick access) and without 3D (guide)", () => {
    expect(s.quickAccess).toMatchObject({ kind: "panel", content: { type: "section", section: "education" } });
    expect(s.guide).toContain('href="https://x.test/#education"');
  });
});

describe.each(MODES)("once years and descriptions are supplied (%s mode)", (mode) => {
  const s = surfaces(detailed, mode);

  it("shows the years on the identity and in the section", () => {
    expect(s.identity).toContain("2021 – 2025");
    expect(s.identity).toContain("2024 – Present");
    expect(s.section).toContain("2021 – 2025");
    expect(s.section).toContain("2024 – Present");
  });

  it("shows the descriptions in the section", () => {
    expect(s.section).toContain("About the B.Tech.");
    expect(s.section).toContain("About the BBA.");
  });
});
