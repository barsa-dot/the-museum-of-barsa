import { describe, expect, it } from "vitest";
import {
  MODES,
  SECTIONS,
  SECTION_ORDER,
  SKILL_CATEGORY_ORDER,
  orderForMode,
  parseProjects,
  profile,
  projects,
  summaryFor,
  viewFor,
  type Mode,
  type Profile,
} from "./index";

const ids = (records: readonly { id: string }[]) => records.map((r) => r.id).sort();

// A fully verified copy, so parity is checked on every record, not only the
// ones that happen to be published today.
const allVerified: Profile = {
  ...profile,
  education: profile.education.map((r) => ({ ...r, verification: "verified" })),
  achievements: profile.achievements.map((r) => ({ ...r, verification: "verified" })),
  experience: profile.experience.map((r) => ({ ...r, verification: "verified" })),
  skills: profile.skills.map((r) => ({ ...r, verification: "verified" })),
};

describe("mode parity", () => {
  it.each(MODES)("%s mode lists every section exactly once", (mode) => {
    expect([...SECTION_ORDER[mode]].sort()).toEqual([...SECTIONS].sort());
  });

  it("both modes list every skill category", () => {
    expect([...SKILL_CATEGORY_ORDER.developer].sort()).toEqual([...SKILL_CATEGORY_ORDER.business].sort());
  });

  it.each([
    ["the real profile", profile],
    ["a fully verified profile", allVerified],
  ])("both modes contain the same records for %s", (_label, source) => {
    const dev = viewFor(source, projects, "developer");
    const biz = viewFor(source, projects, "business");
    for (const key of ["education", "achievements", "experience", "skills", "exhibitedProjects", "sealedProjects"] as const) {
      expect(ids(dev[key]), key).toEqual(ids(biz[key]));
    }
    expect(dev.person).toEqual(biz.person);
    expect(dev.contact).toEqual(biz.contact);
    expect(dev.portrait).toEqual(biz.portrait);
  });

  it("does not lose records when ordering", () => {
    for (const mode of MODES) {
      const view = viewFor(allVerified, projects, mode);
      expect(view.skills).toHaveLength(allVerified.skills.length);
      expect(view.education).toHaveLength(allVerified.education.length);
    }
  });
});

describe("mode emphasis", () => {
  it("puts the B.Tech first in Developer Mode and the BBA first in Business Mode", () => {
    expect(viewFor(profile, projects, "developer").education[0]?.id).toBe("reva-btech-cse");
    expect(viewFor(profile, projects, "business").education[0]?.id).toBe("iimb-bba-dbe");
  });

  it("orders skill groups by the mode's category order", () => {
    const rank = (mode: Mode) => viewFor(allVerified, projects, mode).skills.map((s) => s.category);
    expect(rank("developer")[0]).toBe("language");
    // Business Mode leads with business/communication skills when they exist,
    // otherwise with the first technical group in its order.
    expect(rank("business")[0]).toBe("language");
  });

  it("places prioritised records first and keeps source order for the rest", () => {
    const records = [
      { id: "a" },
      { id: "b", presentation: { developer: { priority: 2 } } },
      { id: "c" },
      { id: "d", presentation: { developer: { priority: 1 } } },
    ];
    expect(orderForMode(records, "developer").map((r) => r.id)).toEqual(["d", "b", "a", "c"]);
    expect(orderForMode(records, "business").map((r) => r.id)).toEqual(["a", "b", "c", "d"]);
  });
});

describe("summaries", () => {
  it("falls back to the record's own description", () => {
    const record = { description: "Base text", presentation: { business: { summary: "Business wording" } } };
    expect(summaryFor(record, "business")).toBe("Business wording");
    expect(summaryFor(record, "developer")).toBe("Base text");
  });

  it("only rewords records that have a description of their own", () => {
    // A mode summary is a rewording, not a new fact.
    const records = [...allVerified.education, ...allVerified.achievements, ...allVerified.experience, ...projects];
    for (const record of records) {
      for (const mode of MODES) {
        if (record.presentation?.[mode]?.summary !== undefined) {
          expect(record.description, `${record.id} has a ${mode} summary but no description`).toBeTruthy();
        }
      }
    }
  });
});

describe("project presentation in projects.json", () => {
  const base = {
    id: "demo", name: "Demo", status: "published", tagline: "", description: "",
    liveUrl: "", githubUrl: "", screenshots: [], limitations: [],
  };

  it("accepts valid presentation metadata", () => {
    const [p] = parseProjects([{ ...base, presentation: { developer: { priority: 1, tags: ["TypeScript"], featured: true } } }]);
    expect(p?.presentation?.developer?.priority).toBe(1);
  });

  it.each([
    ["an unknown mode", { designer: {} }, /unknown mode/],
    ["an unknown field", { developer: { colour: "green" } }, /unknown field/],
    ["a non-numeric priority", { business: { priority: "high" } }, /priority/],
  ])("rejects %s", (_label, presentation, error) => {
    expect(() => parseProjects([{ ...base, presentation }])).toThrow(error);
  });
});
