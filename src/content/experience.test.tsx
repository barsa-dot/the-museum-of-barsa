// Experience and achievements must be complete in both modes: every verified
// record on every surface, with only the order changing per mode. Uses
// clearly fake sample records (src/test/sampleRecords.ts), since the owner's
// real records are not verified yet.

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ACHIEVEMENT_KIND_ORDER, EXPERIENCE_KIND_ORDER, MODES, profile, projects, viewFor, type Mode, type Profile } from "../data/profile";
import { ContentProvider, ProfileContent } from "./components";
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

});


it("keeps unverified experience and empty achievements off the portfolio", () => {
  const { page } = render(profile, "business");
  expect(page).not.toContain("ACHIVIA");
  expect(page).not.toContain('id="achievements"');
});
