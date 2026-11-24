import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MODES, profile, projects, viewFor, type Mode } from "../data/profile";
import type { Achievement, Experience, ExperienceKind, Profile } from "../data/profile/types";
import type { Project } from "../data/profile/project";
import { App } from "../app/App";
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
  const page = renderToStaticMarkup(<App />);

  it.each(MODES)("shows every approved record from the %s presentation", (mode) => {
    const text = textOf(page);
    for (const fact of factsOf(mode)) expect(text, fact).toContain(fact);
  });

  it("links the supplied resume", () => {
    expect(page).toContain(`href="${resumeHref(profile.contact.resume)}"`);
  });

  it("renders the complete collection of approved records", () => {
    const recordIds = (html: string) => {
      const v = viewFor(profile, projects, "developer");
      const known = new Set([
        ...v.education, ...v.experience, ...v.achievements, ...v.skills, ...v.exhibitedProjects, ...v.sealedProjects,
      ].map((r) => r.id));
      return [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!).filter((id) => known.has(id)).sort();
    };
    expect(recordIds(page).length).toBeGreaterThan(20);
  });

  it("never show a project that is waiting for review", () => {
    expect(page).not.toContain("Sample Review Project");
  });
});
