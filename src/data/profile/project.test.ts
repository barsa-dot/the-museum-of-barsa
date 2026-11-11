// Project exhibit data (task 5.4): one reusable structure for problem,
// approach, implementation, features, technologies, evidence, demo and
// limitations, validated when projects.json is read.

import { describe, expect, it } from "vitest";
import { MODES, PROJECT_PART_ORDER, PROJECT_PARTS, hasPart, parseProjects, projects, publicationGaps } from "./index";

const base = {
  id: "sample",
  name: "Sample",
  status: "published",
  tagline: "A sample",
  description: "What it is.",
  liveUrl: "",
  githubUrl: "",
  screenshots: [],
  limitations: [],
};

describe("exhibit parts", () => {
  it("reads every optional part", () => {
    const [p] = parseProjects([
      {
        ...base,
        problem: "The problem.",
        approach: "The approach.",
        features: ["A feature"],
        implementation: ["An architecture note"],
        stack: ["TypeScript"],
        evidence: [
          { kind: "tests", label: "12 tests pass", checked: "2026-11-11" },
          { kind: "documentation", label: "Design notes", url: "https://example.test/docs" },
        ],
        screenshots: [{ src: "images/sample.webp", alt: "The main screen", caption: "Main screen" }],
        limitations: ["English only"],
      },
    ]);
    expect(p!.problem).toBe("The problem.");
    expect(p!.approach).toBe("The approach.");
    expect(p!.implementation).toEqual(["An architecture note"]);
    expect(p!.evidence).toEqual([
      { kind: "tests", label: "12 tests pass", checked: "2026-11-11" },
      { kind: "documentation", label: "Design notes", url: "https://example.test/docs" },
    ]);
    expect(p!.screenshots[0]!.caption).toBe("Main screen");
    for (const part of PROJECT_PARTS) expect(hasPart(p!, part), part).toBe(true);
  });

  it("treats missing or empty parts as absent", () => {
    const [p] = parseProjects([{ ...base, problem: "  ", implementation: [] }]);
    for (const part of PROJECT_PARTS) expect(hasPart(p!, part), part).toBe(false);
  });

  it("drops an empty evidence link instead of rendering it", () => {
    const [p] = parseProjects([{ ...base, evidence: [{ kind: "audit", label: "Audited", url: "" }] }]);
    expect(p!.evidence).toEqual([{ kind: "audit", label: "Audited" }]);
  });

  it.each([
    [{ problem: 3 }, /problem: must be a string/],
    [{ implementation: "one note" }, /implementation: must be a list of strings/],
    [{ evidence: {} }, /evidence: must be a list/],
    [{ evidence: [{ kind: "rumour", label: "x" }] }, /kind: must be one of/],
    [{ evidence: [{ kind: "tests", label: " " }] }, /label: must say what the evidence shows/],
    [{ evidence: [{ kind: "tests", label: "x", url: "http://insecure.test" }] }, /url: must be empty or an https/],
    [{ evidence: [{ kind: "tests", label: "x", checked: "11/11/2026" }] }, /checked: must be a date/],
    [{ evidence: [{ kind: "tests", label: "x", score: 99 }] }, /score: unknown field/],
    [{ screenshots: [{ src: "a.png", alt: "A", caption: 1 }] }, /caption: must be a string/],
  ])("refuses bad input %#", (extra, error) => {
    expect(() => parseProjects([{ ...base, ...extra }])).toThrow(error);
  });
});

describe("part order per mode", () => {
  it.each(MODES)("%s mode orders every part exactly once", (mode) => {
    expect([...PROJECT_PART_ORDER[mode]].sort()).toEqual([...PROJECT_PARTS].sort());
  });

  it("leads with engineering in Developer Mode and with outcomes in Business Mode", () => {
    const at = (mode: (typeof MODES)[number], part: string) => (PROJECT_PART_ORDER[mode] as readonly string[]).indexOf(part);
    expect(at("developer", "implementation")).toBeLessThan(at("developer", "features"));
    expect(at("business", "features")).toBeLessThan(at("business", "implementation"));
    expect(at("business", "evidence")).toBeLessThan(at("business", "stack"));
  });
});

describe("publication gaps", () => {
  it("lists what an exhibit still lacks", () => {
    const [p] = parseProjects([base]);
    expect(publicationGaps(p!)).toEqual(["features", "limitations", "evidence", "screenshots or a live demo"]);
  });

  it("is empty for a complete record", () => {
    const [p] = parseProjects([
      { ...base, features: ["f"], limitations: ["l"], evidence: [{ kind: "tests", label: "t" }], liveUrl: "https://demo.test/" },
    ]);
    expect(publicationGaps(p!)).toEqual([]);
  });

  it("records TaskNest's known gaps from the 5.3 audit", () => {
    // Update this when the owner supplies limitations and evidence for TaskNest.
    const tasknest = projects.find((p) => p.id === "tasknest")!;
    expect(publicationGaps(tasknest)).toEqual(["limitations", "evidence"]);
  });
});
