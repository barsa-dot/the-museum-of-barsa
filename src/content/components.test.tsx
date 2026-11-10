import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MODES, profile, projects, viewFor, type Mode, type Profile } from "../data/profile";
import type { Project } from "../data/profile/project";
import { ContentProvider, ProfileContent, SafeLink } from "./components";
import { formatDateRange, formatPartialDate } from "./rules";

function render(source: Profile, mode: Mode, list: readonly Project[] = projects): string {
  return renderToStaticMarkup(
    <ContentProvider view={viewFor(source, list, mode)}>
      <ProfileContent />
    </ContentProvider>,
  );
}

/** All element ids, in document order. */
const idsIn = (html: string) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
/** Visible text, tags removed. */
const textOf = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const verified = (p: Profile): Profile => ({
  ...p,
  person: { ...p.person, headline: "Headline", introduction: "Intro paragraph.", interests: ["Reading"] },
  education: p.education.map((r) => ({ ...r, verification: "verified", dates: { start: "2022", end: "2026" }, description: "Degree description." })),
  experience: p.experience.map((r) => ({ ...r, verification: "verified", role: "Content writer", description: "What the work involved." })),
  skills: p.skills.map((r) => ({ ...r, verification: "verified" })),
  achievements: [
    { id: "award-1", verification: "verified", kind: "award", title: "An award", issuer: "Issuer", date: "2025-03", description: null, evidenceUrl: "https://evidence.test/a", educationId: null },
  ],
  contact: { ...p.contact, email: "name@mail.test", linkedin: { label: "LinkedIn", url: "https://www.linkedin.com/in/x" }, resume: "resume.pdf" },
});

describe.each([
  ["the real profile", profile],
  ["a fully verified profile", verified(profile)],
])("parity for %s", (_label, source) => {
  const dev = render(source, "developer");
  const biz = render(source, "business");

  it("renders exactly the same records and text in both modes", () => {
    expect([...idsIn(dev)].sort()).toEqual([...idsIn(biz)].sort());
    const words = (html: string) => textOf(html).split(" ").sort();
    expect(words(dev)).toEqual(words(biz));
  });

  it.each(MODES)("never prints empty or placeholder values in %s mode", (mode) => {
    const text = textOf(render(source, mode));
    expect(text).not.toMatch(/\bnull\b|\bundefined\b|NaN|TODO|\[object Object\]/);
  });

  it.each(MODES)("follows the %s section order", (mode) => {
    const view = viewFor(source, projects, mode);
    const sections = idsIn(render(source, mode)).filter((id) => (view.sections as readonly string[]).includes(id));
    expect(sections).toEqual(view.sections.filter((s) => sections.includes(s)));
  });
});

describe("verification", () => {
  it("hides unconfirmed records", () => {
    const html = render(profile, "developer");
    expect(html).not.toContain("ACHIVIA");
    expect(html).not.toContain("FastAPI");
    expect(html).not.toContain('id="skills"');
  });

  it("shows them in both modes once confirmed", () => {
    for (const mode of MODES) {
      const html = render(verified(profile), mode);
      expect(html).toContain("ACHIVIA");
      expect(html).toContain("FastAPI");
      expect(html).toContain('id="skills"');
    }
  });

  it("shows both degrees today", () => {
    const text = textOf(render(profile, "business"));
    expect(text).toContain("B.Tech Computer Science and Engineering");
    expect(text).toContain("BBA Digital Business and Entrepreneurship");
  });
});

describe("projects", () => {
  it("shows unfinished projects by name only", () => {
    const html = render(profile, "developer");
    const sealed = html.slice(html.lastIndexOf("<article", html.indexOf('id="factcheckai"')));
    expect(sealed).toContain("Opening soon");
    expect(textOf(sealed.slice(0, sealed.indexOf("</article>")))).toBe("FactCheckAI Opening soon");
  });

  it("never shows a project awaiting review", () => {
    const pending = [{ ...projects[0]!, id: "pending", name: "Pending Project", status: "ready-for-review" as const }];
    expect(render(profile, "developer", pending)).not.toContain("Pending Project");
  });

  it("hides the live link of a temporarily closed project", () => {
    const closed = [{ ...projects[0]!, status: "unavailable" as const }];
    const html = render(profile, "developer", closed);
    expect(html).toContain("Temporarily closed");
    expect(html).not.toContain("Visit live site");
    expect(html).toContain("View code on GitHub");
  });
});

describe("links", () => {
  it("opens external links safely in a new tab", () => {
    const html = render(verified(profile), "business");
    for (const tag of html.match(/<a [^>]*href="https:[^>]*>/g) ?? []) {
      expect(tag).toContain('target="_blank"');
      expect(tag).toContain('rel="noopener noreferrer"');
    }
    expect(html).toContain('href="mailto:name@mail.test"');
    expect(html).toMatch(/<a href="\/resume\.pdf">/);
  });

  it("refuses unsafe link targets", () => {
    const html = renderToStaticMarkup(<SafeLink href="javascript:alert(1)">Click</SafeLink>);
    expect(html).toBe("Click");
  });
});

describe("date formatting", () => {
  it.each([
    [{ start: null, end: null }, null],
    [{ start: "2022", end: "2026" }, "2022 – 2026"],
    [{ start: "2024-07", end: "present" }, "Jul 2024 – Present"],
    [{ start: null, end: "2026" }, "2026"],
    [{ start: null, end: "present" }, null],
    [{ start: "2025", end: "2025" }, "2025"],
  ] as const)("formats %j as %j", (range, expected) => {
    expect(formatDateRange(range)).toBe(expected);
  });

  it("formats partial dates", () => {
    expect(formatPartialDate("2024")).toBe("2024");
    expect(formatPartialDate("2024-12")).toBe("Dec 2024");
  });
});
