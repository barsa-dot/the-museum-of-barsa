// Project exhibit layouts (task 5.5): one record, presented per mode. Both
// modes show every part the record has, with the same words; only the
// order and styling differ. Unpublished projects never show details.

import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MODES, PROJECT_PART_ORDER, parseProjects, profile, projects, viewFor, type Mode } from "../data/profile";
import type { Project } from "../data/profile/project";
import { ContentProvider, PROJECT_PART_TITLES, ProjectExhibit, SealedProject } from "./components";
import { formatFullDate } from "./rules";

// TEST-ONLY project with every part filled in. Not a real project.
const [full] = parseProjects([
  {
    id: "sample-full",
    name: "Sample Full Project",
    status: "published",
    tagline: "Sample tagline",
    description: "Sample description.",
    role: "Sample role",
    timeline: "2026",
    problem: "Sample problem statement.",
    approach: "Sample approach statement.",
    features: ["Sample feature one", "Sample feature two"],
    implementation: ["Sample architecture note"],
    stack: ["SampleLang"],
    evidence: [
      { kind: "tests", label: "Sample tests pass", checked: "2026-11-11" },
      { kind: "documentation", label: "Sample design notes", url: "https://example.test/docs" },
    ],
    liveUrl: "https://example.test/",
    githubUrl: "https://github.com/example/sample",
    screenshots: [{ src: "images/sample.webp", alt: "Sample main screen", caption: "Sample caption" }],
    limitations: ["Sample limitation"],
  },
]) as [Project];

const render = (project: Project, mode: Mode, sealed = false) =>
  renderToStaticMarkup(
    <ContentProvider view={viewFor(profile, projects, mode)}>
      {sealed ? <SealedProject project={project} /> : <ProjectExhibit project={project} />}
    </ContentProvider>,
  );
const textOf = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const partsIn = (html: string) => [...html.matchAll(/data-part="([^"]+)"/g)].map((m) => m[1]);

describe("full exhibit", () => {
  it.each(MODES)("shows every part in the %s order", (mode) => {
    expect(partsIn(render(full, mode))).toEqual([...PROJECT_PART_ORDER[mode]]);
  });

  it("uses different orders in the two modes", () => {
    expect(partsIn(render(full, "developer"))).not.toEqual(partsIn(render(full, "business")));
  });

  it("shows exactly the same words in both modes", () => {
    const words = (mode: Mode) => textOf(render(full, mode)).split(" ").sort();
    expect(words("developer")).toEqual(words("business"));
  });

  it.each(MODES)("shows every fact of the record in %s mode", (mode) => {
    const text = textOf(render(full, mode));
    for (const fact of [
      "Sample problem statement.",
      "Sample approach statement.",
      "Sample feature one",
      "Sample architecture note",
      "SampleLang",
      "Sample tests pass",
      "checked 11 Nov 2026",
      "Sample design notes",
      "Sample caption",
      "Sample limitation",
      "Visit live site",
      "View code on GitHub",
      ...Object.values(PROJECT_PART_TITLES),
    ]) {
      expect(text, fact).toContain(fact);
    }
  });

  it("links evidence safely and labels each part for assistive technology", () => {
    const html = render(full, "business");
    expect(html).toMatch(/<a href="https:\/\/example.test\/docs" target="_blank" rel="noopener noreferrer">Sample design notes<\/a>/);
    expect(html).toContain('<img src="/images/sample.webp" alt="Sample main screen" loading="lazy"/>');
    for (const title of Object.values(PROJECT_PART_TITLES)) expect(html).toContain(`aria-label="${title}"`);
  });
});

describe("partial records", () => {
  it("shows only the parts a record has, with no empty headings", () => {
    const [bare] = parseProjects([{ ...full, id: "bare", problem: "", implementation: [], evidence: [], screenshots: [], limitations: [] }]) as [Project];
    for (const mode of MODES) {
      const html = render(bare, mode);
      expect(partsIn(html)).toEqual(PROJECT_PART_ORDER[mode].filter((p) => ["approach", "features", "stack"].includes(p)));
      expect(textOf(html)).not.toContain("The problem");
      expect(textOf(html)).not.toContain("Known limitations");
    }
  });

  it("hides the live link while a project is temporarily closed", () => {
    const closed = { ...full, status: "unavailable" as const };
    const text = textOf(render(closed, "developer"));
    expect(text).toContain("Temporarily closed");
    expect(text).not.toContain("Visit live site");
    expect(text).toContain("View code on GitHub");
  });

  it("never shows the details of an unpublished project", () => {
    const sealed = { ...full, status: "in-development" as const };
    for (const mode of MODES) {
      const text = textOf(render(sealed, mode, true));
      expect(text).toBe("Sample Full Project Opening soon");
    }
  });
});

describe("the real registry", () => {
  it("renders TaskNest identically in substance in both modes", () => {
    const tasknest = projects.find((p) => p.id === "tasknest")!;
    const words = (mode: Mode) => textOf(render(tasknest, mode)).split(" ").sort();
    expect(words("developer")).toEqual(words("business"));
    expect(textOf(render(tasknest, "business"))).toContain("Key features");
  });
});

describe("evidence dates", () => {
  it.each([
    ["2026-11-11", "11 Nov 2026"],
    ["2026-01-05", "5 Jan 2026"],
    ["2026-11", null],
    ["2026-13-01", null],
  ])("formats %s", (input, expected) => {
    expect(formatFullDate(input)).toBe(expected);
  });
});

describe("mode styles", () => {
  const dev = readFileSync("src/styles/developer.css", "utf8");
  const biz = readFileSync("src/styles/business-pages.css", "utf8");

  it("gives each mode its own treatment of the new parts", () => {
    expect(dev).toContain('[data-mode="developer"] .project-evidence__item::before');
    expect(dev).toContain('.project-part[data-part="implementation"]');
    expect(biz).toContain('[data-mode="business"] .project-evidence__item::before');
    expect(biz).toContain('.project-part[data-part="problem"]');
  });

  it("keeps decorative markers silent for screen readers", () => {
    for (const css of [dev, biz]) {
      for (const m of css.matchAll(/\.project-[^{]*::before\s*\{[^}]*content:\s*([^;]+);/g)) {
        expect(m[1], m[0]).toMatch(/\/\s*""\s*$/);
      }
    }
  });
});
