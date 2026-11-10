// Tabs linking to each section on the page, in the mode's order. Only
// sections with verified content are listed (the same rule as the page
// itself), so every tab leads somewhere. Styled per mode.

import { useModeView, sectionHasContent } from "../content/components";
import { SECTION_TITLES } from "../content/rules";

export function SectionNav() {
  const view = useModeView();
  const sections = view.sections.filter((id) => sectionHasContent(view, id));
  if (sections.length === 0) return null;
  return (
    <nav className="section-nav" aria-label="Sections">
      <ul className="section-nav__list">
        {sections.map((id) => (
          <li key={id}>
            <a className="section-nav__link" href={`#${id}`}>
              {SECTION_TITLES[id]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
