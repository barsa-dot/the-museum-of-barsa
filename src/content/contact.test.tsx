// Resume and contact must be quick to reach in both modes: header shortcuts
// on the portfolio pages, the Contact section, the museum's quick access and
// the Courtyard. Nothing may link to a file or address that isn't supplied.

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MODES, profile, projects, viewFor, type Mode, type Profile } from "../data/profile";
import { ContentProvider, ProfileContent } from "./components";
import { resumeHref } from "./rules";
import { QuickLinks } from "../app/QuickLinks";
import { buildExhibits } from "../museum/scene/exhibits";
import { recruiterShortcuts } from "../museum/navigation";

// Test-only sample contact details (not the owner's).
const complete: Profile = {
  ...profile,
  contact: {
    ...profile.contact,
    email: "sample@example.com",
    linkedin: { label: "linkedin.com/in/sample", url: "https://www.linkedin.com/in/sample" },
    resume: "resume.pdf",
  },
};

function surfaces(source: Profile, mode: Mode) {
  const view = viewFor(source, projects, mode);
  const wrap = (node: React.ReactNode) => renderToStaticMarkup(<ContentProvider view={view}>{node}</ContentProvider>);
  return {
    header: wrap(<QuickLinks />),
    page: wrap(<ProfileContent />),
    shortcuts: recruiterShortcuts(view),
    sign: buildExhibits(view).find((s) => s.id === "courtyard-contact"),
  };
}

describe.each(MODES)("today, in %s mode", (mode) => {
  const s = surfaces(profile, mode);

  it("offers a Contact shortcut in the header, leading to the Contact section", () => {
    expect(s.header).toContain('href="#contact"');
    expect(s.page).toContain('id="contact"');
    expect(s.page).toContain('href="https://github.com/barsa-dot"');
  });

  it("does not link to a resume that hasn't been supplied", () => {
    expect(s.header).not.toContain("Resume");
    expect(s.page).not.toContain(".pdf");
    expect(s.shortcuts.find((x) => x.id === "resume")).toMatchObject({ kind: "unavailable" });
  });

  it("reaches contact from the museum: quick access and the Courtyard sign", () => {
    expect(s.shortcuts.find((x) => x.id === "contact")).toMatchObject({ content: { type: "section", section: "contact" } });
    expect(s.sign?.plaque.lines).toEqual(["github.com/barsa-dot"]);
  });
});

describe.each(MODES)("once email, LinkedIn and a resume are supplied (%s mode)", (mode) => {
  const s = surfaces(complete, mode);

  it("adds a Resume shortcut to the header, opening the PDF", () => {
    expect(s.header).toContain('href="/resume.pdf"');
    expect(s.header).toContain("opens in a new tab");
  });

  it("lists every contact route in the Contact section", () => {
    expect(s.page).toContain('href="mailto:sample@example.com"');
    expect(s.page).toContain('href="https://www.linkedin.com/in/sample"');
    expect(s.page).toContain('href="/resume.pdf"');
  });

  it("links the resume from the museum's quick access and shows the addresses in the Courtyard", () => {
    expect(s.shortcuts.find((x) => x.id === "resume")).toEqual({ id: "resume", label: "Resume (PDF)", kind: "link", href: "/resume.pdf" });
    expect(s.sign?.plaque.lines).toEqual(["sample@example.com", "github.com/barsa-dot", "linkedin.com/in/sample"]);
  });
});

describe("resume file", () => {
  it("builds a same-site path, whatever slashes the setting has", () => {
    expect(resumeHref("resume.pdf")).toBe("/resume.pdf");
    expect(resumeHref("/resume.pdf")).toBe("/resume.pdf");
    expect(resumeHref("//evil.example/resume.pdf")).toBe("/evil.example/resume.pdf");
    expect(resumeHref(null)).toBeNull();
  });

  it("exists in app/public whenever one is configured", () => {
    const resume = profile.contact.resume;
    if (resume) expect(existsSync(resolve(__dirname, "../../app/public", resume))).toBe(true);
  });
});
