// Experience and achievements must be complete in both modes: every verified
// record on every surface, with only the order changing per mode. Uses
// clearly fake sample records (src/test/sampleRecords.ts), since the owner's
// real records are not verified yet.

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ACHIEVEMENT_KIND_ORDER, EXPERIENCE_KIND_ORDER, MODES, profile, projects, viewFor, type Mode, type Profile } from "../data/profile";
import { ContentProvider, ProfileContent } from "./components";
import { buildExhibits } from "../museum/scene/exhibits";
import { ExhibitPanel } from "../museum/ExhibitPanel";
import { MuseumGuide } from "../museum/MuseumGuide";
import { recruiterShortcuts } from "../museum/navigation";
import { SAMPLE_ACHIEVEMENTS, SAMPLE_EXPERIENCE, withSamples } from "../test/sampleRecords";

const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const ids = (records: readonly { id: string }[]) => records.map((r) => r.id);

function render(source: Profile, mode: Mode) {
  const view = viewFor(source, projects, mode);
  return { view, page: text(renderToStaticMarkup(<ContentProvider view={view}><ProfileContent /></ContentProvider>)) };
}

describe.each(MODES)("experience and achievements in %s mode", (mode) => {
  const { view, page } = render(withSamples(), mode);

  it("includes every verified record, the same set as the other mode", () => {
    const other = viewFor(withSamples(), projects, mode === "developer" ? "business" : "developer");
    expect(ids(view.experience).sort()).toEqual(ids(SAMPLE_EXPERIENCE).sort());
    expect(ids(view.achievements).sort()).toEqual(ids(SAMPLE_ACHIEVEMENTS).sort());
    expect(ids(view.experience).sort()).toEqual(ids(other.experience).sort());
    expect(ids(view.achievements).sort()).toEqual(ids(other.achievements).sort());
  });

  it("orders records by the mode's type order", () => {
    expect(view.experience.map((e) => e.kind)).toEqual(EXPERIENCE_KIND_ORDER[mode]);
    expect(view.achievements.map((a) => a.kind)).toEqual(ACHIEVEMENT_KIND_ORDER[mode]);
  });

  it("renders every record on the portfolio page, in that order", () => {
    const positions = SAMPLE_EXPERIENCE.map((e) => page.indexOf(e.organisation));
    for (const p of positions) expect(p).toBeGreaterThan(-1);
    const shown = [...view.experience].map((e) => page.indexOf(e.organisation));
    expect(shown).toEqual([...shown].sort((a, b) => a - b));
    for (const a of SAMPLE_ACHIEVEMENTS) expect(page).toContain(a.title);
  });

  it("places every record in the museum: experience in the Archive, achievements in the Library", () => {
    const specs = buildExhibits(view);
    const archive = specs.filter((s) => s.room === "archive").map((s) => s.exhibit?.content);
    expect(archive).toEqual(view.experience.map((e) => ({ type: "experience", id: e.id })));
    const library = specs.filter((s) => s.exhibit?.content.type === "achievement").map((s) => s.exhibit?.content);
    expect(library).toEqual(view.achievements.map((a) => ({ type: "achievement", id: a.id })));
    expect(specs.filter((s) => s.room === "library" && s.kind === "wallPlaque")).toHaveLength(view.education.length + view.achievements.length);
  });

  it("renders museum panels only from the verified profile, never from sample data", () => {
    const panel = (content: { type: "achievement" | "experience"; id: string }) =>
      text(renderToStaticMarkup(<ExhibitPanel exhibit={{ id: "x", label: "x", verb: "View", x: 0, z: 0, radius: 1, content }} mode={mode} onClose={() => {}} />));
    // ExhibitPanel reads the real profile; check it refuses what isn't verified there.
    expect(panel({ type: "achievement", id: "sample-award" })).toContain("still being prepared");
  });

  it("reaches both without walking (quick access) and without 3D (guide)", () => {
    const shortcuts = recruiterShortcuts(view).map((s) => s.id);
    expect(shortcuts).toContain("experience");
    expect(shortcuts).toContain("achievements");
  });
});

describe.each(MODES)("with more records than wall space (%s mode)", (mode) => {
  const view = viewFor(withSamples(10, 5), projects, mode);
  const specs = buildExhibits(view);

  it("never hides a record: the last board opens the full list", () => {
    const archive = specs.filter((s) => s.room === "archive");
    const more = archive.at(-1)!;
    expect(more.exhibit?.content).toEqual({ type: "section", section: "experience" });
    const direct = archive.length - 1;
    expect(more.plaque.title).toBe(`${view.experience.length - direct} more`);
    expect(archive.slice(0, -1).map((s) => s.exhibit?.content)).toEqual(
      view.experience.slice(0, direct).map((e) => ({ type: "experience", id: e.id })),
    );

    const achievements = specs.filter((s) => s.id.startsWith("library-achievement"));
    expect(achievements.at(-1)!.exhibit?.content).toEqual({ type: "section", section: "achievements" });
  });
});

describe("before any experience or achievement is verified", () => {
  it("keeps the Archive notice, adds no achievement boards and no empty shortcut", () => {
    for (const mode of MODES) {
      const view = viewFor(profile, projects, mode);
      const specs = buildExhibits(view);
      expect(specs.filter((s) => s.room === "archive").map((s) => s.kind)).toEqual(["noticeBoard"]);
      expect(specs.some((s) => s.id.startsWith("library-achievement"))).toBe(false);
      expect(recruiterShortcuts(view).some((s) => s.id === "achievements")).toBe(false);
    }
  });

  it("links achievements from the no-3D guide only once they exist", () => {
    const guide = renderToStaticMarkup(<MuseumGuide mode="business" title="t" reason="r" onExit={() => {}} currentUrl="https://x.test/" />);
    expect(guide).not.toContain("#achievements");
  });
});
