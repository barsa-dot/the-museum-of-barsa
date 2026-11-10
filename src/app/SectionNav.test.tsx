import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { profile, projects, viewFor, type Profile } from "../data/profile";
import { ContentProvider, ProfileContent, sectionHasContent } from "../content/components";
import { SectionNav } from "./SectionNav";

const nav = (mode: "developer" | "business", source: Profile = profile) =>
  [...renderToStaticMarkup(
    <ContentProvider view={viewFor(source, projects, mode)}>
      <SectionNav />
    </ContentProvider>,
  ).matchAll(/href="#([a-z]+)"/g)].map((m) => m[1]);

describe("SectionNav", () => {
  it("lists only sections that have content, in each mode's order", () => {
    for (const mode of ["developer", "business"] as const) {
      const view = viewFor(profile, projects, mode);
      expect(nav(mode)).toEqual(view.sections.filter((id) => sectionHasContent(view, id)));
    }
    expect(nav("developer")).toEqual(["projects", "education", "contact"]);
    expect(nav("business")).toEqual(["education", "projects", "contact"]);
  });

  it("offers the same sections in both modes", () => {
    expect([...nav("developer")].sort()).toEqual([...nav("business")].sort());
  });

  it("adds a section's tab once its records are verified", () => {
    const verified: Profile = { ...profile, skills: profile.skills.map((s) => ({ ...s, verification: "verified" })) };
    expect(nav("developer", verified)).toContain("skills");
  });
});

describe("terminal decoration hooks", () => {
  const html = renderToStaticMarkup(
    <ContentProvider view={viewFor(profile, projects, "developer")}>
      <ProfileContent />
    </ContentProvider>,
  );

  it("labels sections and cards for the Developer styles, without adding visible text", () => {
    expect(html).toContain('data-path="projects"');
    expect(html).toContain('data-file="projects/tasknest/README.md"');
    expect(html).toContain('data-file="education/reva-btech-cse.md"');
    expect(html.replace(/<[^>]+>/g, " ")).not.toContain("README.md");
  });
});
