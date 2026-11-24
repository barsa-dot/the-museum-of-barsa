// Education must be complete in both modes, on every surface: both degrees,
// the mode's emphasis (B.Tech leads in Developer, BBA in Business), and any
// details the owner adds (years, descriptions) appear everywhere at once.

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MODES, profile, projects, viewFor, type Mode, type Profile } from "../data/profile";
import { ContentProvider, ProfileContent } from "./components";

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
  return {
    section: wrap(<ProfileContent />),
    view,
  };
}

describe.each(MODES)("education in %s mode", (mode) => {
  const s = surfaces(profile, mode);

  it("lists both degrees in the Education section, leading with the mode's degree", () => {
    expect(order(s.section)[0]).toBe(LEAD[mode]);
    const featured = s.view.education.find((e) => e.presentation?.[mode]?.featured);
    expect(`${featured?.field}`).toBe(LEAD[mode]);
  });

});

describe.each(MODES)("once years and descriptions are supplied (%s mode)", (mode) => {
  const s = surfaces(detailed, mode);

  it("shows the years in the Education section", () => {
    expect(s.section).toContain("2021 – 2025");
    expect(s.section).toContain("2024 – Present");
  });

  it("shows the descriptions in the section", () => {
    expect(s.section).toContain("About the B.Tech.");
    expect(s.section).toContain("About the BBA.");
  });
});
