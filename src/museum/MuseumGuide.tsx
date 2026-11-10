// The museum without 3D: every space, what it holds, and a link to that
// content on the portfolio pages. Shown when WebGL is unavailable or the 3D
// view fails. Sections with nothing verified yet say so instead of linking
// to an empty page.

import { profile, projects, viewFor } from "../data/profile";
import type { Mode, SectionId } from "../data/profile/presentation";
import { sectionHasContent } from "../content/components";
import { ROOMS } from "./rooms";

/** Link to a section on the portfolio pages, keeping the mode. */
export function portfolioSectionHref(currentUrl: string, section: SectionId): string {
  const url = new URL(currentUrl);
  url.searchParams.delete("view");
  url.hash = section;
  return url.toString();
}

export function MuseumGuide({
  mode,
  title,
  reason,
  onExit,
  currentUrl = typeof window === "undefined" ? "https://localhost/" : window.location.href,
}: {
  mode: Mode;
  title: string;
  reason: string;
  onExit: () => void;
  currentUrl?: string;
}) {
  const view = viewFor(profile, projects, mode);
  return (
    <section className="museum-guide" aria-labelledby="museum-guide-title">
      <h2 id="museum-guide-title" className="museum-guide__title">
        {title}
      </h2>
      <p className="museum-guide__reason">{reason}</p>
      <p>Here is everything the museum holds. Each room links to the same content on the portfolio pages.</p>
      <ul className="museum-guide__rooms">
        <li className="museum-guide__room">
          <span className="museum-guide__name">The Grand Atrium</span>
          <span className="museum-guide__theme">The central hall that connects every room</span>
        </li>
        {ROOMS.map((room) => {
          const ready = sectionHasContent(view, room.section);
          return (
            <li key={room.id} className="museum-guide__room">
              <span className="museum-guide__name">{room.name}</span>
              <span className="museum-guide__theme">{room.theme}</span>
              {ready ? (
                <a className="museum-guide__link" href={portfolioSectionHref(currentUrl, room.section)}>
                  View {room.theme.toLowerCase()}
                </a>
              ) : (
                <span className="museum-guide__pending">Being prepared</span>
              )}
              {room.section === "education" && sectionHasContent(view, "achievements") && (
                <a className="museum-guide__link" href={portfolioSectionHref(currentUrl, "achievements")}>
                  View achievements
                </a>
              )}
            </li>
          );
        })}
      </ul>
      <button type="button" className="museum__start" onClick={onExit}>
        Go to the portfolio
      </button>
    </section>
  );
}
