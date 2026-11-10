// Always-visible shortcuts to contact details and the resume, in the header
// of both modes. Each appears only when it leads somewhere real: Contact
// once there are verified contact details, Resume once a file is supplied.

import { sectionHasContent, useModeView } from "../content/components";
import { resumeHref } from "../content/rules";

export function QuickLinks() {
  const view = useModeView();
  const contact = sectionHasContent(view, "contact");
  const resume = resumeHref(view.contact?.resume);
  if (!contact && !resume) return null;
  return (
    <nav className="quick-links" aria-label="Quick links">
      <ul className="quick-links__list">
        {contact && (
          <li>
            <a className="quick-links__link" href="#contact">
              Contact
            </a>
          </li>
        )}
        {resume && (
          <li>
            <a className="quick-links__link" href={resume} target="_blank" rel="noopener">
              Resume <span className="visually-hidden">(PDF, opens in a new tab)</span>
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}
