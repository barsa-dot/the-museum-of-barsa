// Read helpers over the profile. Views use these instead of reading the raw
// data, so unconfirmed records can never leak into the public site.

import type { AchievementKind, ExperienceKind, Profile, RecordBase, SkillCategory } from "./types";
import type { Project } from "./project";
import { ACHIEVEMENT_KIND_ORDER, EXPERIENCE_KIND_ORDER, SECTION_ORDER, SKILL_CATEGORY_ORDER, orderForMode, type Mode } from "./presentation";

function onlyVerified<T extends RecordBase>(records: readonly T[]): T[] {
  return records.filter((record) => record.verification === "verified");
}

/**
 * The public view of the profile: every collection with unconfirmed records
 * removed. Person and contact are dropped to null if unconfirmed.
 */
export function publishable(profile: Profile) {
  return {
    person: profile.person.verification === "verified" ? profile.person : null,
    portrait: profile.portrait,
    education: onlyVerified(profile.education),
    achievements: onlyVerified(profile.achievements),
    experience: onlyVerified(profile.experience),
    skills: onlyVerified(profile.skills),
    contact: profile.contact.verification === "verified" ? profile.contact : null,
  };
}

export type PublicProfile = ReturnType<typeof publishable>;

/**
 * Everything one mode renders: the public profile with sections and records
 * ordered for that mode. Both modes receive exactly the same records; only
 * order and presentation metadata differ.
 */
export function viewFor(profile: Profile, projects: readonly Project[], mode: Mode) {
  const pub = publishable(profile);
  const categoryRank = (category: SkillCategory) =>
    (SKILL_CATEGORY_ORDER[mode] as readonly SkillCategory[]).indexOf(category);
  const experienceRank = (kind: ExperienceKind) => (EXPERIENCE_KIND_ORDER[mode] as readonly ExperienceKind[]).indexOf(kind);
  const achievementRank = (kind: AchievementKind) => (ACHIEVEMENT_KIND_ORDER[mode] as readonly AchievementKind[]).indexOf(kind);

  return {
    mode,
    sections: SECTION_ORDER[mode],
    person: pub.person,
    portrait: pub.portrait,
    contact: pub.contact,
    education: orderForMode(pub.education, mode),
    // Types follow the mode's order; priorities apply within a type. Nothing is dropped.
    achievements: orderForMode(pub.achievements, mode).sort((a, b) => achievementRank(a.kind) - achievementRank(b.kind)),
    experience: orderForMode(pub.experience, mode).sort((a, b) => experienceRank(a.kind) - experienceRank(b.kind)),
    // Skill groups follow the mode's category order; priorities apply within a group.
    skills: orderForMode(pub.skills, mode).sort((a, b) => categoryRank(a.category) - categoryRank(b.category)),
    exhibitedProjects: orderForMode(exhibitedProjects(projects), mode),
    sealedProjects: orderForMode(sealedProjects(projects), mode),
  };
}

export type ModeView = ReturnType<typeof viewFor>;

/** Projects shown as full exhibits (open or temporarily closed). */
export function exhibitedProjects(projects: readonly Project[]): Project[] {
  return projects.filter((p) => p.status === "published" || p.status === "unavailable");
}

/** Projects shown only as a sealed "Opening soon" door (name only). */
export function sealedProjects(projects: readonly Project[]): Project[] {
  return projects.filter((p) => p.status === "in-development");
}
