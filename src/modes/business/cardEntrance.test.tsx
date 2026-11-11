import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { profile, projects, viewFor } from "../../data/profile";
import { ContentProvider } from "../../content/components";
import { IdentityCard } from "./IdentityCard";
import { CARD_PLAYED_KEY, chooseCardEntrance, markCardEntrancePlayed } from "./cardEntrance";

function session(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return { data, getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => void (data[k] = v) };
}
const blocked = {
  getItem: () => { throw new Error("blocked"); },
  setItem: () => { throw new Error("blocked"); },
};

describe("chooseCardEntrance", () => {
  it("drops the card on the first Business visit of a session", () => {
    expect(chooseCardEntrance({ prefersReducedMotion: false, session: session() })).toBe("drop");
  });

  it("does not replay within the same session", () => {
    const s = session();
    markCardEntrancePlayed(s);
    expect(s.data[CARD_PLAYED_KEY]).toBe("1");
    expect(chooseCardEntrance({ prefersReducedMotion: false, session: s })).toBe("none");
  });

  it("never animates for reduced-motion visitors", () => {
    expect(chooseCardEntrance({ prefersReducedMotion: true, session: session() })).toBe("none");
  });

  it("still works when storage is blocked", () => {
    expect(chooseCardEntrance({ prefersReducedMotion: false, session: blocked })).toBe("drop");
    expect(() => markCardEntrancePlayed(blocked)).not.toThrow();
  });
});

describe("IdentityCard entrance states", () => {
  const render = (entrance: "drop" | "none") =>
    renderToStaticMarkup(
      <ContentProvider view={viewFor(profile, projects, "business")}>
        <IdentityCard entrance={entrance} />
      </ContentProvider>,
    );

  it("starts dropping with a skip control", () => {
    const html = render("drop");
    expect(html).toContain('data-phase="dropping"');
    expect(html).toMatch(/<button type="button" class="biz-identity__skip">Skip animation<\/button>/);
  });

  it("renders settled with no skip control when there is no entrance", () => {
    const html = render("none");
    expect(html).toContain('data-phase="settled"');
    expect(html).not.toContain("Skip animation");
  });

  it("keeps every detail in the markup during the animation (nothing is only in motion)", () => {
    const dropping = render("drop").replace(/<button[^>]*>Skip animation<\/button>/, "").replace(/data-phase="\w+"/, "");
    const settled = render("none").replace(/data-phase="\w+"/, "");
    expect(dropping).toBe(settled);
  });

  it("draws the lanyard as decoration only", () => {
    expect(render("drop")).toContain('<span class="id-card-drop__strap" aria-hidden="true">');
  });
});

describe("entrance styles", () => {
  const css = readFileSync(new URL("../../styles/business.css", import.meta.url), "utf8");
  const ms = (pattern: RegExp) => Number(css.match(pattern)?.[1]);

  it("finishes in about 1.5 seconds", () => {
    expect(ms(/id-card-drop (\d+)ms/)).toBeLessThanOrEqual(1100);
    expect(ms(/id-card-reveal-last 1ms (\d+)ms/)).toBeLessThanOrEqual(1600);
    const lastReveal = ms(/\.id-card__facts \{ animation-delay: (\d+)ms/) + ms(/id-card-reveal (\d+)ms/);
    expect(lastReveal).toBeLessThanOrEqual(ms(/id-card-reveal-last 1ms (\d+)ms/));
  });

  it("hangs at a gentle tilt and sways a few degrees around it, with no spin", () => {
    const tilts = [...css.matchAll(/--card-tilt: (-?[\d.]+)deg/g)].map((m) => Math.abs(Number(m[1])));
    expect(tilts.length).toBeGreaterThan(0);
    expect(Math.max(...tilts)).toBeLessThanOrEqual(10);
    const sway = [...css.matchAll(/var\(--card-tilt\) [+-] ([\d.]+)deg/g)].map((m) => Number(m[1]));
    expect(sway.length).toBeGreaterThan(0);
    expect(Math.max(...sway)).toBeLessThanOrEqual(3);
    // Every other rotation goes through the tilt variable.
    expect(css.replace(/rotate\((calc\()?var\(--card-tilt\)[^;]*/g, "")).not.toMatch(/rotate\(/);
  });

  it("has a reduced-motion safety net", () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*animation-duration: 1ms !important/);
  });
});
