import { describe, expect, it } from "vitest";
import { MODES, profile, projects, viewFor, type Profile } from "../data/profile";
import { overlaps } from "./collision";
import { ATRIUM_DESTINATION, ROOM_DESTINATIONS, recruiterShortcuts } from "./navigation";
import { ROOMS } from "./rooms";
import { locate } from "./scene/atriumLayout";
import { buildMuseumWorld } from "./scene/museum";
import { PLAN_AREAS } from "./scene/plan";
import { PLAYER_RADIUS } from "./world";

describe.each(MODES)("map destinations in %s mode", (mode) => {
  const world = buildMuseumWorld(viewFor(profile, projects, mode));

  it("has one per room plus the atrium", () => {
    expect(ROOM_DESTINATIONS.map((d) => d.id).sort()).toEqual(ROOMS.map((r) => r.id).sort());
    expect(locate(PLAN_AREAS, ATRIUM_DESTINATION.spot)).toBe("Grand Atrium");
  });

  it.each(ROOM_DESTINATIONS.map((d) => [d.name, d] as const))("places the visitor inside %s, in open floor", (name, d) => {
    expect(locate(PLAN_AREAS, d.spot)).toBe(name);
    for (const c of world.colliders) expect(overlaps(d.spot, PLAYER_RADIUS, c)).toBe(false);
  });
});

describe("recruiter shortcuts", () => {
  it("cover every section plus the resume, so nothing needs walking to reach", () => {
    const ids = recruiterShortcuts(viewFor(profile, projects, "business")).map((s) => s.id);
    expect(ids).toEqual(["projects", "education", "experience", "skills", "about", "contact", "resume"]);
  });

  it("never link to a resume that doesn't exist", () => {
    const resume = recruiterShortcuts(viewFor(profile, projects, "developer")).find((s) => s.id === "resume")!;
    expect(resume.kind).toBe("unavailable");
  });

  it("link to the resume once it is supplied", () => {
    const withResume: Profile = { ...profile, contact: { ...profile.contact, resume: "resume.pdf" } };
    const resume = recruiterShortcuts(viewFor(withResume, projects, "developer")).find((s) => s.id === "resume")!;
    expect(resume).toEqual({ id: "resume", label: "Resume (PDF)", kind: "link", href: "/resume.pdf" });
  });
});
