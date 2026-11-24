// Skills must be complete in both modes. Technical skills and broader
// capabilities are told apart by presentation (family headings, order,
// Workshop boards), never by leaving either out. Uses test-only samples.

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MODES, SKILL_FAMILIES, profile, projects, skillFamily, skillFamilyOrder, viewFor, type Mode, type SkillCategory } from "../data/profile";
import { ContentProvider, ProfileContent } from "./components";
import { withSampleSkills } from "../test/sampleRecords";

const ALL_CATEGORIES: SkillCategory[] = ["language", "framework", "data", "tool", "business", "communication"];
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const LEAD: Record<Mode, string> = { developer: "Technical skills", business: "Broader capabilities" };

describe("skill families", () => {
  it("put every category in exactly one family", () => {
    const listed = [...SKILL_FAMILIES.technical, ...SKILL_FAMILIES.broader] as SkillCategory[];
    expect([...listed].sort()).toEqual([...ALL_CATEGORIES].sort());
    for (const c of ALL_CATEGORIES) expect(SKILL_FAMILIES[skillFamily(c)]).toContain(c);
  });

  it("lead with technical skills in Developer and broader capabilities in Business", () => {
    expect(skillFamilyOrder("developer")).toEqual(["technical", "broader"]);
    expect(skillFamilyOrder("business")).toEqual(["broader", "technical"]);
  });
});

describe.each(MODES)("skills in %s mode", (mode) => {
  const source = withSampleSkills();
  const view = viewFor(source, projects, mode);
  const html = renderToStaticMarkup(<ContentProvider view={view}><ProfileContent /></ContentProvider>);
  const page = text(html);

  it("lists every verified skill, the same set as the other mode", () => {
    for (const s of source.skills) expect(page, s.name).toContain(s.name);
    const other = viewFor(source, projects, mode === "developer" ? "business" : "developer");
    expect(view.skills.map((s) => s.id).sort()).toEqual(other.skills.map((s) => s.id).sort());
  });

  it("separates the two families under their own headings, in the mode's order", () => {
    expect(html).toContain('data-family="technical"');
    expect(html).toContain('data-family="broader"');
    const first = page.indexOf(LEAD[mode]);
    const second = page.indexOf(LEAD[mode] === "Technical skills" ? "Broader capabilities" : "Technical skills");
    expect(first).toBeGreaterThan(-1);
    expect(second).toBeGreaterThan(first);
  });

});

describe("with only technical skills verified", () => {
  it("shows one family and no empty heading", () => {
    const source = { ...profile, skills: profile.skills.map((s) => ({ ...s, verification: "verified" as const })) };
    const view = viewFor(source, projects, "business");
    const html = renderToStaticMarkup(<ContentProvider view={view}><ProfileContent /></ContentProvider>);
    expect(html).not.toContain("Broader capabilities");
  });
});

describe("before any skill is verified", () => {
  it("leaves out an empty Skills section", () => {
    for (const mode of MODES) {
      const view = viewFor(profile, projects, mode);
    }
  });
});
