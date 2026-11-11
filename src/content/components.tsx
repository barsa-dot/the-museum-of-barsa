// Shared content components used by both visual modes.
//
// Every component reads from a ModeView (see viewFor), so both modes render
// the same verified records. Components never decide WHAT to show based on
// the mode — only the view's ordering and presentation metadata (summary,
// tags, featured) differ. Visual styling comes from the mode's tokens.

import { createContext, useContext, type ReactNode } from "react";
import type { ModeView } from "../data/profile/selectors";
import { hasPart, type Project, type ProjectPart } from "../data/profile/project";
import type { Achievement, Education, Experience, ExperienceKind, Skill, SkillCategory } from "../data/profile/types";
import { PROJECT_PART_ORDER, presentationFor, skillFamily, skillFamilyOrder, summaryFor, type Presentable, type SectionId } from "../data/profile/presentation";
import {
  EXPERIENCE_LABELS,
  SECTION_TITLES,
  SKILL_FAMILY_LABELS,
  SKILL_LABELS,
  formatDateRange,
  formatFullDate,
  formatPartialDate,
  hasText,
  isSafeHref,
  linkProps,
  resumeHref,
} from "./rules";

// ---------- Context ----------

const ViewContext = createContext<ModeView | null>(null);

export function ContentProvider({ view, children }: { view: ModeView; children: ReactNode }) {
  return <ViewContext.Provider value={view}>{children}</ViewContext.Provider>;
}

export function useModeView(): ModeView {
  const view = useContext(ViewContext);
  if (!view) throw new Error("useModeView must be used inside <ContentProvider>");
  return view;
}

// ---------- Small building blocks ----------

export function SafeLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  if (!isSafeHref(href)) return <>{children}</>;
  return (
    <a className={className} {...linkProps(href)}>
      {children}
    </a>
  );
}

function Meta({ items }: { items: (string | null | undefined)[] }) {
  const shown = items.filter(hasText);
  if (shown.length === 0) return null;
  return <p className="content-meta">{shown.join(" · ")}</p>;
}

function Tags({ tags }: { tags: string[] | undefined }) {
  if (!tags || tags.length === 0) return null;
  return (
    <ul className="content-tags" aria-label="Tags">
      {tags.map((tag) => (
        <li key={tag}>{tag}</li>
      ))}
    </ul>
  );
}

function List({ items, className = "content-list" }: { items: string[] | undefined; className?: string }) {
  const shown = (items ?? []).filter(hasText);
  if (shown.length === 0) return null;
  return (
    <ul className={className}>
      {shown.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * Props shared by every record card: mode emphasis, an anchor id, and a
 * file-style label (e.g. "education/reva-btech-cse.md") that Developer Mode
 * shows in the card's terminal title bar. The label is decoration only.
 */
function cardProps(record: Presentable & { id: string }, mode: ModeView["mode"], file: string) {
  return {
    id: record.id,
    className: "content-card",
    "data-featured": presentationFor(record, mode).featured ? "true" : undefined,
    "data-file": file,
  };
}

// ---------- Sections ----------

export function Section({ id, children }: { id: SectionId; children: ReactNode }) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} className="content-section" aria-labelledby={headingId} data-path={id}>
      <h2 id={headingId} className="content-section__title">
        {SECTION_TITLES[id]}
      </h2>
      {children}
    </section>
  );
}

/**
 * The About section body. Name and headline belong to each mode's identity
 * component (Developer hero / Business identity card), so they are not
 * repeated here.
 */
export function PersonIntro() {
  const { person } = useModeView();
  if (!person) return null;
  return (
    <div className="content-person">
      {hasText(person.introduction) && <p className="content-person__intro">{person.introduction}</p>}
      <List items={person.interests} className="content-tags" />
    </div>
  );
}

export function EducationCard({ record }: { record: Education }) {
  const { mode } = useModeView();
  const text = summaryFor(record, mode);
  return (
    <article {...cardProps(record, mode, `education/${record.id}.md`)}>
      <h3 className="content-card__title">
        {record.qualification} {record.field}
      </h3>
      <Meta items={[record.institution, formatDateRange(record.dates)]} />
      {hasText(text) && <p className="content-card__text">{text}</p>}
      <Tags tags={presentationFor(record, mode).tags} />
    </article>
  );
}

export function AchievementCard({ record }: { record: Achievement }) {
  const { mode } = useModeView();
  const text = summaryFor(record, mode);
  return (
    <article {...cardProps(record, mode, `achievements/${record.id}.md`)}>
      <h3 className="content-card__title">{record.title}</h3>
      <Meta items={[record.issuer, record.date ? formatPartialDate(record.date) : null]} />
      {hasText(text) && <p className="content-card__text">{text}</p>}
      {record.evidenceUrl && (
        <p className="content-card__links">
          <SafeLink href={record.evidenceUrl}>View evidence</SafeLink>
        </p>
      )}
    </article>
  );
}

export function ExperienceCard({ record }: { record: Experience }) {
  const { mode } = useModeView();
  const text = summaryFor(record, mode);
  return (
    <article {...cardProps(record, mode, `experience/${record.id}.md`)}>
      <h3 className="content-card__title">{record.role ?? record.organisation}</h3>
      <Meta items={[record.role ? record.organisation : null, formatDateRange(record.dates)]} />
      {hasText(text) && <p className="content-card__text">{text}</p>}
      <Tags tags={presentationFor(record, mode).tags} />
      {record.links.length > 0 && (
        <p className="content-card__links">
          {record.links.map((link) => (
            <SafeLink key={link.url} href={link.url}>
              {link.label}
            </SafeLink>
          ))}
        </p>
      )}
    </article>
  );
}

/** Headings for project exhibit parts. Same words in both modes; only styling differs. */
export const PROJECT_PART_TITLES: Record<ProjectPart, string> = {
  problem: "The problem",
  approach: "Approach",
  features: "Key features",
  implementation: "How it is built",
  stack: "Built with",
  evidence: "Evidence",
  screenshots: "Screenshots",
  limitations: "Known limitations",
};

function ProjectPartBody({ project, part }: { project: Project; part: ProjectPart }) {
  switch (part) {
    case "problem":
      return <p className="content-card__text">{project.problem}</p>;
    case "approach":
      return <p className="content-card__text">{project.approach}</p>;
    case "features":
      return <List items={project.features} />;
    case "implementation":
      return <List items={project.implementation} className="content-list project-part__notes" />;
    case "stack":
      return <List items={project.stack} className="content-tags" />;
    case "evidence":
      return (
        <ul className="project-evidence">
          {(project.evidence ?? []).map((e) => (
            <li key={`${e.kind}-${e.label}`} className="project-evidence__item" data-kind={e.kind}>
              {e.url && isSafeHref(e.url) ? <SafeLink href={e.url}>{e.label}</SafeLink> : <span>{e.label}</span>}
              {e.checked && formatFullDate(e.checked) && (
                <span className="project-evidence__checked"> · checked {formatFullDate(e.checked)}</span>
              )}
            </li>
          ))}
        </ul>
      );
    case "screenshots":
      return (
        <div className="content-card__media">
          {project.screenshots.map((shot) => (
            <figure key={shot.src} className="project-shot">
              <img src={`/${shot.src}`} alt={shot.alt} loading="lazy" />
              {hasText(shot.caption) && <figcaption>{shot.caption}</figcaption>}
            </figure>
          ))}
        </div>
      );
    case "limitations":
      return <List items={project.limitations} />;
  }
}

/**
 * A published (or temporarily closed) project. Every part the record has is
 * shown in both modes; the mode only sets the order (PROJECT_PART_ORDER):
 * Developer leads with how it is built, Business with what it does and the
 * evidence. Limitations are always included.
 */
export function ProjectExhibit({ project }: { project: Project }) {
  const { mode } = useModeView();
  const closed = project.status === "unavailable";
  const text = presentationFor(project, mode).summary ?? project.description;
  const parts = PROJECT_PART_ORDER[mode].filter((part) => hasPart(project, part));
  return (
    <article {...cardProps(project, mode, `projects/${project.id}/README.md`)} data-status={project.status} data-title={project.name}>
      <p className="content-label">{closed ? "Temporarily closed" : "Now showing"}</p>
      <h3 className="content-card__title">{project.name}</h3>
      {hasText(project.tagline) && <p className="content-card__tagline">{project.tagline}</p>}
      <Meta items={[project.role, project.timeline]} />
      {hasText(text) && <p className="content-card__text">{text}</p>}
      {parts.map((part) => (
        <section key={part} className="project-part" data-part={part} aria-label={PROJECT_PART_TITLES[part]}>
          <h4 className="content-card__subheading">{PROJECT_PART_TITLES[part]}</h4>
          <ProjectPartBody project={project} part={part} />
        </section>
      ))}
      {(hasText(project.liveUrl) && !closed) || hasText(project.githubUrl) ? (
        <p className="content-card__links">
          {hasText(project.liveUrl) && !closed && <SafeLink href={project.liveUrl}>Visit live site</SafeLink>}
          {hasText(project.githubUrl) && <SafeLink href={project.githubUrl}>View code on GitHub</SafeLink>}
        </p>
      ) : null}
    </article>
  );
}

/** Unpublished project: name only, no description or claims. */
export function SealedProject({ project }: { project: Project }) {
  return (
    <article className="content-card content-card--sealed" id={project.id} data-status={project.status} data-file={`projects/${project.id}/ (locked)`}>
      <h3 className="content-card__title">{project.name}</h3>
      <p className="content-label">Opening soon</p>
    </article>
  );
}

export function ContactLinks() {
  const { contact } = useModeView();
  if (!contact) return null;
  const links = [
    contact.email ? { label: contact.email, url: `mailto:${contact.email}` } : null,
    contact.github,
    contact.linkedin,
    contact.resume ? { label: "Resume (PDF)", url: resumeHref(contact.resume) ?? "" } : null,
    ...contact.other,
  ].filter((link): link is { label: string; url: string } => link !== null && isSafeHref(link.url));
  if (links.length === 0) return null;
  return (
    <ul className="content-contact">
      {links.map((link) => (
        <li key={link.url}>
          <SafeLink href={link.url}>{link.label}</SafeLink>
        </li>
      ))}
    </ul>
  );
}

// ---------- Section bodies ----------

function groupBy<T, K extends string>(items: readonly T[], key: (item: T) => K, order: readonly K[]): [K, T[]][] {
  return order
    .map((k): [K, T[]] => [k, items.filter((item) => key(item) === k)])
    .filter(([, group]) => group.length > 0);
}

const SECTION_BODIES: Record<SectionId, () => ReactNode> = {
  about: () => <PersonIntro />,
  education: function EducationSection() {
    const { education } = useModeView();
    return education.map((r) => <EducationCard key={r.id} record={r} />);
  },
  achievements: function AchievementsSection() {
    const { achievements } = useModeView();
    return achievements.map((r) => <AchievementCard key={r.id} record={r} />);
  },
  experience: function ExperienceSection() {
    const { experience } = useModeView();
    // Groups appear in the order their first (mode-ordered) record appears.
    const order = [...new Set(experience.map((e) => e.kind))] as ExperienceKind[];
    return groupBy(experience, (e) => e.kind, order).map(([kind, records]) => (
      <div key={kind} className="content-group">
        <h3 className="content-group__title">{EXPERIENCE_LABELS[kind]}</h3>
        {records.map((r) => (
          <ExperienceCard key={r.id} record={r} />
        ))}
      </div>
    ));
  },
  projects: function ProjectsSection() {
    const { exhibitedProjects, sealedProjects } = useModeView();
    return (
      <>
        {exhibitedProjects.map((p) => (
          <ProjectExhibit key={p.id} project={p} />
        ))}
        {sealedProjects.map((p) => (
          <SealedProject key={p.id} project={p} />
        ))}
      </>
    );
  },
  skills: function SkillsSection() {
    const { skills, mode } = useModeView();
    const order = [...new Set(skills.map((s) => s.category))] as SkillCategory[];
    // Technical skills and broader capabilities, in the mode's order; both always shown.
    return groupBy(skills, (s: Skill) => skillFamily(s.category), skillFamilyOrder(mode)).map(([family, members]) => (
      <div key={family} className="content-family" data-family={family}>
        <h3 className="content-family__title">{SKILL_FAMILY_LABELS[family]}</h3>
        {groupBy(members, (s: Skill) => s.category, order).map(([category, records]) => (
          <div key={category} className="content-group">
            <h4 className="content-group__title">{SKILL_LABELS[category]}</h4>
            <ul className="content-tags">
              {records.map((s) => (
                <li key={s.id} id={s.id}>
                  {s.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    ));
  },
  contact: () => <ContactLinks />,
};

/** One section's content, without its heading. Used by museum exhibits. */
export function SectionBody({ id }: { id: SectionId }) {
  const Body = SECTION_BODIES[id];
  return <Body />;
}

/** Whether a section has anything verified to show. Same answer in both modes. */
export function sectionHasContent(view: ModeView, id: SectionId): boolean {
  switch (id) {
    case "about":
      return view.person !== null && (hasText(view.person.introduction) || view.person.interests.length > 0);
    case "education":
      return view.education.length > 0;
    case "achievements":
      return view.achievements.length > 0;
    case "experience":
      return view.experience.length > 0;
    case "projects":
      return view.exhibitedProjects.length + view.sealedProjects.length > 0;
    case "skills":
      return view.skills.length > 0;
    case "contact":
      return view.contact !== null && Boolean(view.contact.email || view.contact.github || view.contact.linkedin || view.contact.resume || view.contact.other.length);
  }
}

/**
 * The complete profile in the mode's section order. Sections with nothing
 * verified yet are left out (in both modes alike) instead of showing
 * placeholders.
 */
export function ProfileContent() {
  const view = useModeView();
  return (
    <>
      {view.sections
        .filter((id) => sectionHasContent(view, id))
        .map((id) => {
          const Body = SECTION_BODIES[id];
          return (
            <Section key={id} id={id}>
              <Body />
            </Section>
          );
        })}
    </>
  );
}
