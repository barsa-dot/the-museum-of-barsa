import { describe, expect, it } from "vitest";
import { profile, projects, parseProjects, publishable, exhibitedProjects, sealedProjects } from "./index";
import type { Profile } from "./types";

const collections = (p: Profile) => [p.education, p.achievements, p.experience, p.skills] as const;

describe("profile data", () => {
  it("uses unique, lowercase-kebab ids within each collection", () => {
    for (const records of collections(profile)) {
      const ids = records.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("contains no placeholder text", () => {
    expect(JSON.stringify(profile)).not.toMatch(/TODO|lorem|example\.com|your-profile/i);
  });

  it("includes both degrees", () => {
    const fields = profile.education.map((e) => `${e.qualification} ${e.field}`);
    expect(fields).toContain("B.Tech Computer Science and Engineering");
    expect(fields).toContain("BBA Digital Business and Entrepreneurship");
  });

  it("links achievements only to education records that exist", () => {
    const educationIds = new Set(profile.education.map((e) => e.id));
    for (const a of profile.achievements) {
      if (a.educationId !== null) expect(educationIds).toContain(a.educationId);
    }
  });

  it("does not ship a portrait until a real photo is supplied", () => {
    // Guards against a stand-in face being added: assets must be real files
    // under images/ with descriptive alt text.
    for (const asset of [profile.portrait.photo, profile.portrait.pixel]) {
      if (asset === null) continue;
      expect(asset.src).toMatch(/^images\//);
      expect(asset.alt.length).toBeGreaterThan(10);
    }
  });
});

describe("publishable()", () => {
  it("removes unverified records and keeps verified ones", () => {
    const pub = publishable(profile);
    for (const records of [pub.education, pub.achievements, pub.experience, pub.skills]) {
      for (const r of records) expect(r.verification).toBe("verified");
    }
    expect(pub.education).toHaveLength(2);
    expect(pub.experience.find((e) => e.id === "achivia-writing")).toBeUndefined();
    expect(pub.skills).toHaveLength(0);
  });

  it("drops unverified person and contact blocks", () => {
    const draft: Profile = {
      ...profile,
      person: { ...profile.person, verification: "unverified" },
      contact: { ...profile.contact, verification: "unverified" },
    };
    const pub = publishable(draft);
    expect(pub.person).toBeNull();
    expect(pub.contact).toBeNull();
  });
});

describe("project registry", () => {
  it("parses the real projects.json", () => {
    expect(projects.map((p) => p.id)).toEqual(["tasknest", "factcheckai", "humanizer"]);
  });

  it("splits exhibits from sealed doors by status", () => {
    expect(exhibitedProjects(projects).map((p) => p.id)).toEqual(["tasknest"]);
    expect(sealedProjects(projects).map((p) => p.id)).toEqual(["factcheckai", "humanizer"]);
  });

  it("never exhibits a project awaiting review", () => {
    const pending = parseProjects([{ ...base, status: "ready-for-review" }]);
    expect(exhibitedProjects(pending)).toHaveLength(0);
    expect(sealedProjects(pending)).toHaveLength(0);
  });

  const base = {
    id: "demo",
    name: "Demo",
    status: "published",
    tagline: "",
    description: "",
    liveUrl: "",
    githubUrl: "",
    screenshots: [],
    limitations: [],
  };

  it.each([
    ["an unknown status", { status: "finished" }, /status/],
    ["a duplicate id", null, /duplicate id/],
    ["a non-https link", { liveUrl: "http://x.dev" }, /liveUrl/],
    ["a bad id", { id: "Demo Project" }, /lowercase-kebab/],
    ["a screenshot without alt text", { screenshots: [{ src: "images/a.png", alt: " " }] }, /alt/],
    ["a missing field", { tagline: undefined }, /tagline/],
  ])("rejects %s", (_label, patch, error) => {
    const input = patch === null ? [base, base] : [{ ...base, ...patch }];
    expect(() => parseProjects(input)).toThrow(error);
  });
});
