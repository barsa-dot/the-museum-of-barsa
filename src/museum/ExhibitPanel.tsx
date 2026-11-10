// Accessible HTML panel for an exhibit, opened from the 3D world. Shows the
// same verified content as the portfolio pages, rendered by the shared
// content components: a whole section, a single record, the owner's
// identity, or an honest notice. Esc or the close button closes it.

import { useEffect, useRef, type ReactNode } from "react";
import { profile, projects, viewFor } from "../data/profile";
import type { ModeView } from "../data/profile/selectors";
import type { Mode } from "../data/profile/presentation";
import { AchievementCard, ContentProvider, EducationCard, ExperienceCard, ProjectExhibit, SectionBody, sectionHasContent } from "../content/components";
import { SECTION_TITLES, hasText } from "../content/rules";
import type { Exhibit, ExhibitContent } from "./world";

function titleOf(content: ExhibitContent, view: ModeView): string {
  switch (content.type) {
    case "section":
      return SECTION_TITLES[content.section];
    case "education": {
      const e = view.education.find((r) => r.id === content.id);
      return e ? `${e.qualification}, ${e.institution}` : "Education";
    }
    case "project":
      return view.exhibitedProjects.find((p) => p.id === content.id)?.name ?? "Project";
    case "experience":
      return view.experience.find((r) => r.id === content.id)?.organisation ?? "Experience";
    case "achievement":
      return view.achievements.find((r) => r.id === content.id)?.title ?? "Achievement";
    case "identity":
      return view.person?.name ?? "Portrait";
    case "notice":
      return content.title;
  }
}

/** Panel body. Records are looked up in the verified view, so nothing unverified can render. */
function Body({ content, view, mode }: { content: ExhibitContent; view: ModeView; mode: Mode }): ReactNode {
  const missing = <p className="exhibit-panel__empty">This exhibit is still being prepared.</p>;
  switch (content.type) {
    case "section":
      return sectionHasContent(view, content.section) ? <SectionBody id={content.section} /> : missing;
    case "education": {
      const record = view.education.find((r) => r.id === content.id);
      return record ? <EducationCard record={record} /> : missing;
    }
    case "project": {
      const project = view.exhibitedProjects.find((p) => p.id === content.id);
      return project ? <ProjectExhibit project={project} /> : missing;
    }
    case "experience": {
      const record = view.experience.find((r) => r.id === content.id);
      return record ? <ExperienceCard record={record} /> : missing;
    }
    case "achievement": {
      const record = view.achievements.find((r) => r.id === content.id);
      return record ? <AchievementCard record={record} /> : missing;
    }
    case "identity": {
      if (!view.person) return missing;
      const image = mode === "developer" ? view.portrait.pixel : view.portrait.photo;
      return (
        <div className="exhibit-identity">
          {image && (
            <img
              className={`exhibit-identity__image exhibit-identity__image--${mode}`}
              src={`/${image.src}`}
              alt={image.alt}
              width={image.width}
              height={image.height}
            />
          )}
          <div>
            <p className="exhibit-identity__name">{view.person.name}</p>
            {hasText(view.person.headline) && <p className="exhibit-identity__headline">{view.person.headline}</p>}
            {hasText(view.person.introduction) && <p>{view.person.introduction}</p>}
            {view.education.length > 0 && (
              <ul className="content-list">
                {view.education.map((e) => (
                  <li key={e.id}>
                    {e.qualification} {e.field}, {e.institution}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    }
    case "notice":
      return <p className="exhibit-panel__empty">{content.text}</p>;
  }
}

export function ExhibitPanel({ exhibit, mode, onClose }: { exhibit: Exhibit; mode: Mode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const view = viewFor(profile, projects, mode);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal?.();
    const onCancel = (event: Event) => {
      event.preventDefault(); // close through React so state stays in sync
      onClose();
    };
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [onClose]);

  return (
    <dialog ref={ref} className="exhibit-panel" aria-labelledby="exhibit-panel-title" data-exhibit={exhibit.id}>
      <header className="exhibit-panel__head">
        <h2 id="exhibit-panel-title" className="exhibit-panel__title">
          {titleOf(exhibit.content, view)}
        </h2>
        <button type="button" className="exhibit-panel__close" onClick={onClose} aria-label="Close exhibit">
          Close <kbd>Esc</kbd>
        </button>
      </header>
      <div className="exhibit-panel__body">
        <ContentProvider view={view}>
          <Body content={exhibit.content} view={view} mode={mode} />
        </ContentProvider>
      </div>
    </dialog>
  );
}
