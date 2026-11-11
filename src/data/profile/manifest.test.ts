// Project manifest format (task 6.2). All manifests here are TEST-ONLY.

import { describe, expect, it } from "vitest";
import { MANIFEST_FILE, manifestToProject, parseManifest } from "./manifest";
import { parseProjects } from "./project";

const minimal = {
  manifestVersion: 1,
  id: "sample",
  name: "Sample",
  status: "in-development",
  tagline: "",
  description: "",
  repositoryUrl: "",
  demoUrl: "",
  screenshots: [],
  limitations: [],
};

const full = {
  ...minimal,
  status: "ready-for-review",
  tagline: "Sample tagline",
  description: "Sample description.",
  role: "Sample role",
  timeline: "2026",
  problem: "Sample problem.",
  approach: "Sample approach.",
  features: ["Sample feature"],
  implementation: ["Sample note"],
  stack: ["SampleLang"],
  evidence: [{ kind: "tests", label: "Sample tests pass", checked: "2026-11-11" }],
  repositoryUrl: "https://github.com/example/sample",
  demoUrl: "https://sample.example.test/",
  screenshots: [{ src: "docs/shot.webp", alt: "Sample screen", caption: "Sample caption" }],
  release: { version: "1.2.0", date: "2026-11-02", notesUrl: "https://github.com/example/sample/releases/tag/v1.2.0" },
  limitations: ["Sample limitation"],
};

describe("parseManifest", () => {
  it("accepts a minimal manifest", () => {
    const m = parseManifest(minimal);
    expect(m.id).toBe("sample");
    expect(m.status).toBe("in-development");
    expect(m.fields.githubUrl).toBe("");
  });

  it("maps every field to its registry name", () => {
    const m = parseManifest(full);
    expect(m.status).toBe("ready-for-review");
    expect(m.fields).toMatchObject({
      githubUrl: "https://github.com/example/sample",
      liveUrl: "https://sample.example.test/",
      problem: "Sample problem.",
      release: { version: "1.2.0", date: "2026-11-02", notesUrl: "https://github.com/example/sample/releases/tag/v1.2.0" },
    });
    expect(m.fields).not.toHaveProperty("repositoryUrl");
    expect(m.fields).not.toHaveProperty("status");
  });

  it.each([
    [{ ...minimal, status: "published" }, /status: must be in-development or ready-for-review/],
    [{ ...minimal, status: "unavailable" }, /status: must be/],
    [{ ...minimal, manifestVersion: 2 }, /manifestVersion: must be 1/],
    [{ ...minimal, presentation: {} }, /presentation: per-mode presentation is set in projects.json/],
    [{ ...minimal, sparkle: true }, /sparkle: unknown field/],
    [(({ demoUrl: _d, ...rest }) => rest)(minimal), /demoUrl: is required/],
    [{ ...minimal, demoUrl: "http://insecure.test" }, /^museum-manifest\.json demoUrl: must be empty or an https/],
    [{ ...minimal, repositoryUrl: "ftp://x" }, /^museum-manifest\.json repositoryUrl: must be empty or an https/],
    [{ ...minimal, id: "Not Kebab" }, /id: "Not Kebab" must be lowercase-kebab/],
    [{ ...minimal, release: { version: "1", date: "Nov 2026" } }, /release\.date: must be a date/],
    [{ ...minimal, release: { version: " ", date: "2026-11-02" } }, /release\.version: must not be empty/],
    [{ ...minimal, release: { version: "1", date: "2026-11-02", latest: true } }, /release\.latest: unknown field/],
    [{ ...minimal, screenshots: [{ src: "a.png", alt: "" }] }, /alt: must describe the screenshot/],
    [[], /must be an object/],
  ])("refuses bad manifests %#", (input, error) => {
    expect(() => parseManifest(input)).toThrow(error);
  });

  it("names the manifest file in every error", () => {
    expect(() => parseManifest({ ...minimal, id: 3 })).toThrow(new RegExp(`^${MANIFEST_FILE.replace(".", "\\.")} `));
  });
});

describe("manifestToProject", () => {
  const [published] = parseProjects([
    {
      id: "sample",
      name: "Old name",
      status: "published",
      tagline: "Old",
      description: "Old.",
      liveUrl: "",
      githubUrl: "",
      screenshots: [],
      limitations: [],
      presentation: { business: { priority: 1 } },
    },
  ]);

  it("proposes a new project at the manifest's status", () => {
    const p = manifestToProject(parseManifest(full));
    expect(p.status).toBe("ready-for-review");
    expect(p.name).toBe("Sample");
  });

  it("never changes the status of a published or closed project", () => {
    for (const status of ["published", "unavailable"] as const) {
      const p = manifestToProject(parseManifest(minimal), { ...published!, status });
      expect(p.status).toBe(status);
    }
  });

  it("can't publish a sealed project", () => {
    const sealed = { ...published!, status: "in-development" as const };
    expect(manifestToProject(parseManifest(full), sealed).status).toBe("ready-for-review");
  });

  it("takes content from the manifest and keeps the registry's presentation", () => {
    const p = manifestToProject(parseManifest(full), published);
    expect(p.description).toBe("Sample description.");
    expect(p.presentation).toEqual({ business: { priority: 1 } });
  });

  it("produces an entry the registry accepts", () => {
    const p = manifestToProject(parseManifest(full), published);
    expect(() => parseProjects([p])).not.toThrow();
    expect(parseProjects([p])[0]).toEqual(p);
  });

  it("refuses a manifest for a different project", () => {
    expect(() => manifestToProject(parseManifest(full), { ...published!, id: "other" })).toThrow(/does not match/);
  });
});
