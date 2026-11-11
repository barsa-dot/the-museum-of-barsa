// Content parity across both modes and every surface (task 4.8).
//
// Every approved record must be reachable in Developer Mode AND Business
// Mode, on each way of reading the portfolio: the portfolio pages, the
// walkable museum (exhibits and the panels they open), the map's quick
// access and the no-3D guide. Modes may reorder and restyle; they may not
// drop anything.
//
// The profile is replaced with a fully verified TEST-ONLY copy (sample
// records added to every collection, more than the museum has wall space
// for), so parity is checked on every kind of record, not only the few
// that are verified today. None of these samples are facts about the owner.

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MODES, profile, projects, viewFor, type Mode } from "../data/profile";
import type { Achievement, Experience, ExperienceKind, Profile } from "../data/profile/types";
import type { Project } from "../data/profile/project";
import { App } from "../app/App";
import { STORAGE_KEY, createModeStore } from "../state/mode";
import { buildExhibits } from "../museum/scene/exhibits";
import { ExhibitPanel } from "../museum/ExhibitPanel";
import { MuseumGuide } from "../museum/MuseumGuide";
import { recruiterShortcuts } from "../museum/navigation";
import type { ExhibitContent } from "../museum/world";
import { sectionHasContent } from "./components";
import { resumeHref } from "./rules";

vi.mock("../data/profile", async () => {
  const actual = await vi.importActual<typeof import("../data/profile")>("../data/profile");
  const real = actual.profile;
  const exp = (id: string, kind: ExperienceKind, organisation: string): Experience => ({
    id,
    verification: "verified",
    kind,
    organisation,
    role: `Role at ${organisation}`,
    dates: { start: "2024", end: "present" },
    description: `Sample description for ${id}.`,
    links: [],
  });
  const ach = (id: string, kind: Achievement["kind"], title: string): Achievement => ({
    id,
    verification: "verified",
    kind,
    title,
    issuer: "Sample Issuer",
    date: "2024",
    description: null,
    evidenceUrl: null,
    educationId: null,
  });
  const full: Profile = {
    ...real,
    person: { ...real.person, verification: "verified", headline: "Sample headline", introduction: "Sample introduction.", interests: ["Sample interest"] },
    education: real.education.map((r) => ({ ...r, verification: "verified" })),
    experience: [
      ...real.experience.map((r) => ({ ...r, verification: "verified" as const })),
      exp("sample-volunteer", "volunteering", "Sample Volunteers"),
      exp("sample-event", "event", "Sample Summit"),
      exp("sample-writing", "writing", "Sample Journal"),
      exp("sample-lead", "leadership", "Sample Society"),
      // More than the Archive's seven wall places.
      ...Array.from({ length: 6 }, (_, i) => exp(`sample-work-${i}`, "work", `Sample Company ${i}`)),
    ],
    achievements: [
      ach("sample-award", "award", "Sample Award"),
      ach("sample-cert", "certification", "Sample Certificate"),
      ach("sample-academic", "academic", "Sample Honour"),
      // More than the Library's three achievement places.
      ach("sample-award-2", "award", "Sample Second Award"),
    ],
    skills: [
      ...real.skills.map((r) => ({ ...r, verification: "verified" as const })),
      { id: "sample-strategy", verification: "verified", name: "Sample Strategy", category: "business" },
      { id: "sample-speaking", verification: "verified", name: "Sample Speaking", category: "communication" },
    ],
    contact: {
      ...real.contact,
      verification: "verified",
      email: "sample@mail.test",
      github: real.contact.github ?? { label: "GitHub", url: "https://github.com/sample" },
      linkedin: { label: "LinkedIn", url: "https://www.linkedin.com/in/sample" },
      resume: "sample-resume.pdf",
    },
  };
  const base = actual.projects.find((p) => p.status === "published")!;
  const sampleProjects: Project[] = [
    ...actual.projects,
    { ...base, id: "sample-open", name: "Sample Open Project", tagline: "Sample open tagline", status: "published", presentation: { business: { priority: 0 } } },
    { ...base, id: "sample-closed", name: "Sample Closed Project", tagline: "Sample closed tagline", status: "unavailable" },
    { ...base, id: "sample-sealed", name: "Sample Sealed Project", status: "in-development" },
    { ...base, id: "sample-review", name: "Sample Review Project", status: "ready-for-review" },
  ];
  return { ...actual, profile: full, projects: sampleProjects };
});

const textOf = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const words = (html: string) => textOf(html).split(" ").sort();

/** The visible facts each approved record must show wherever it is read. */
function factsOf(mode: Mode): string[] {
  const v = viewFor(profile, projects, mode);
  return [
    v.person!.name,
    v.person!.headline!,
    ...v.education.flatMap((e) => [e.qualification, e.institution]),
    ...v.experience.map((e) => e.organisation),
    ...v.achievements.map((a) => a.title),
    ...v.skills.map((s) => s.name),
    ...v.exhibitedProjects.flatMap((p) => [p.name, p.tagline]),
    ...v.sealedProjects.map((p) => p.name),
    v.contact!.email!,
    v.contact!.github!.label,
    v.contact!.linkedin!.label,
  ];
}

describe("the test profile", () => {
  it("is the fully verified test copy, with every kind of record", () => {
    const v = viewFor(profile, projects, "developer");
    expect(v.education.length).toBeGreaterThanOrEqual(2);
    expect(new Set(v.experience.map((e) => e.kind)).size).toBe(5);
    expect(new Set(v.achievements.map((a) => a.kind)).size).toBe(3);
    expect(new Set(v.skills.map((s) => s.category)).size).toBe(6);
    expect(v.exhibitedProjects.map((p) => p.status)).toEqual(expect.arrayContaining(["published", "unavailable"]));
    expect(v.sealedProjects.length).toBeGreaterThan(0);
  });

  it("gives both modes the same facts", () => {
    expect([...factsOf("developer")].sort()).toEqual([...factsOf("business")].sort());
  });
});

describe("portfolio pages", () => {
  const page = (mode: Mode) => {
    const data: Record<string, string> = { [STORAGE_KEY]: mode };
    const storage = { getItem: (k: string) => data[k] ?? null, setItem: () => {}, removeItem: () => {} };
    return renderToStaticMarkup(<App store={createModeStore({ storage })} />);
  };
  const pages = { developer: page("developer"), business: page("business") };

  it.each(MODES)("show every approved record in %s mode", (mode) => {
    const text = textOf(pages[mode]);
    for (const fact of factsOf(mode)) expect(text, fact).toContain(fact);
  });

  it("link the resume in both modes", () => {
    const href = resumeHref(profile.contact.resume)!;
    for (const mode of MODES) expect(pages[mode]).toContain(`href="${href}"`);
  });

  it("render the same record elements in both modes", () => {
    const recordIds = (html: string) => {
      const v = viewFor(profile, projects, "developer");
      const known = new Set([
        ...v.education, ...v.experience, ...v.achievements, ...v.skills, ...v.exhibitedProjects, ...v.sealedProjects,
      ].map((r) => r.id));
      return [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!).filter((id) => known.has(id)).sort();
    };
    expect(recordIds(pages.developer)).toEqual(recordIds(pages.business));
    expect(recordIds(pages.developer).length).toBeGreaterThan(20);
  });

  it("never show a project that is waiting for review", () => {
    for (const mode of MODES) expect(pages[mode]).not.toContain("Sample Review Project");
  });
});

describe("walkable museum", () => {
  /** Records a visitor can open from the museum: directly, or through a section board or shortcut. */
  function reachable(mode: Mode): string[] {
    const v = viewFor(profile, projects, mode);
    const contents: ExhibitContent[] = [
      ...buildExhibits(v).flatMap((s) => (s.exhibit ? [s.exhibit.content] : [])),
      ...recruiterShortcuts(v).flatMap((s) => (s.kind === "panel" ? [s.content] : [])),
    ];
    const ids = new Set<string>();
    const add = (kind: string, records: readonly { id: string }[]) => records.forEach((r) => ids.add(`${kind}:${r.id}`));
    for (const c of contents) {
      if (c.type === "education" || c.type === "experience" || c.type === "achievement" || c.type === "project") ids.add(`${c.type}:${c.id}`);
      if (c.type === "identity") ids.add("identity");
      if (c.type !== "section") continue;
      if (c.section === "education") add("education", v.education);
      if (c.section === "experience") add("experience", v.experience);
      if (c.section === "achievements") add("achievement", v.achievements);
      if (c.section === "skills") add("skill", v.skills);
      if (c.section === "projects") add("project", [...v.exhibitedProjects, ...v.sealedProjects]);
      if (c.section === "about" || c.section === "contact") ids.add(c.section);
    }
    return [...ids].sort();
  }

  it("lets both modes reach exactly the same records", () => {
    expect(reachable("developer")).toEqual(reachable("business"));
  });

  it.each(MODES)("reaches every approved record in %s mode", (mode) => {
    const v = viewFor(profile, projects, mode);
    const expected = [
      ...v.education.map((r) => `education:${r.id}`),
      ...v.experience.map((r) => `experience:${r.id}`),
      ...v.achievements.map((r) => `achievement:${r.id}`),
      ...v.skills.map((r) => `skill:${r.id}`),
      ...[...v.exhibitedProjects, ...v.sealedProjects].map((r) => `project:${r.id}`),
      "about",
      "contact",
      "identity",
    ];
    expect(reachable(mode)).toEqual(expected.sort());
  });

  it("builds the same rooms with the same number and kinds of exhibits in both modes", () => {
    // When a wall is full, which records get their own board follows the
    // mode's order (the rest are one step away on the "N more" board), so
    // compare the layout, not the record on each board.
    const byRoom = (mode: Mode) => {
      const rooms: Record<string, string[]> = {};
      for (const s of buildExhibits(viewFor(profile, projects, mode))) (rooms[s.room] ??= []).push(s.kind);
      return Object.fromEntries(Object.entries(rooms).map(([k, kinds]) => [k, kinds.sort()]));
    };
    expect(byRoom("developer")).toEqual(byRoom("business"));
    expect(Object.keys(byRoom("developer")).sort()).toEqual(["archive", "courtyard", "creation", "library", "portrait", "workshop"]);
  });

  it("shows a \"more\" board, never a silent cut, when a wall is full", () => {
    for (const mode of MODES) {
      const ids = buildExhibits(viewFor(profile, projects, mode)).map((s) => s.id);
      expect(ids).toContain("archive-more");
      expect(ids).toContain("library-achievements-more");
    }
  });

  it("offers the same map shortcuts in both modes", () => {
    const ids = (mode: Mode) => recruiterShortcuts(viewFor(profile, projects, mode)).map((s) => `${s.id}:${s.kind}`).sort();
    expect(ids("developer")).toEqual(ids("business"));
  });

  it("opens panels with the same text in both modes", () => {
    const panel = (content: ExhibitContent, mode: Mode) =>
      renderToStaticMarkup(
        <ExhibitPanel exhibit={{ id: "x", label: "X", verb: "View", x: 0, z: 0, radius: 1, content }} mode={mode} onClose={() => {}} />,
      );
    const v = viewFor(profile, projects, "developer");
    const contents = [
      ...buildExhibits(v).flatMap((s) => (s.exhibit ? [s.exhibit.content] : [])),
      ...recruiterShortcuts(v).flatMap((s) => (s.kind === "panel" ? [s.content] : [])),
    ];
    expect(contents.length).toBeGreaterThan(15);
    // Same words; order may differ (e.g. the degree leading in each mode).
    for (const c of contents) expect(words(panel(c, "developer")), JSON.stringify(c)).toEqual(words(panel(c, "business")));
  });

  it("shows every approved record across its panels in each mode", () => {
    for (const mode of MODES) {
      const v = viewFor(profile, projects, mode);
      const all = [{ type: "identity" } as const, ...recruiterShortcuts(v).flatMap((s) => (s.kind === "panel" ? [s.content] : []))]
        .map((content) => renderToStaticMarkup(<ExhibitPanel exhibit={{ id: "x", label: "X", verb: "View", x: 0, z: 0, radius: 1, content }} mode={mode} onClose={() => {}} />))
        .join(" ");
      const text = textOf(all);
      for (const fact of factsOf(mode)) expect(text, `${mode}: ${fact}`).toContain(fact);
    }
  });
});

describe("museum without 3D", () => {
  const hrefs = (mode: Mode) =>
    [...renderToStaticMarkup(<MuseumGuide mode={mode} title="t" reason="r" onExit={() => {}} currentUrl="https://museum.test/" />).matchAll(/href="([^"]+)"/g)]
      .map((m) => m[1]!)
      .sort();

  it("links the same sections in both modes, covering every section with content", () => {
    expect(hrefs("developer")).toEqual(hrefs("business"));
    const v = viewFor(profile, projects, "developer");
    for (const section of v.sections) {
      if (!sectionHasContent(v, section)) continue;
      expect(hrefs("developer"), section).toContain(`https://museum.test/#${section}`);
    }
  });
});
