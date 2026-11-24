import { Suspense, lazy, useLayoutEffect } from "react";
import { profile, projects, viewFor } from "../data/profile";
import { ContentProvider, ProfileContent } from "../content/components";
import { IdentityCard } from "../modes/business/IdentityCard";
import { SectionNav } from "./SectionNav";
import { QuickLinks } from "./QuickLinks";
import { viewFromUrl, type View } from "../state/view";

const Arcade = lazy(() => import("../arcade/Arcade"));
const portfolio = viewFor(profile, projects, "business");

export function App({ view = typeof window === "undefined" ? "portfolio" : viewFromUrl(window.location.href) }: { view?: View }) {
  return (
    <>
      <a className="skip-link" href="#content">Skip to content</a>
      <header className="shell-header">
        <div className="shell-header__row">
          <a className="shell-header__name" href={view === "arcade" ? "?" : "#content"}>{profile.person.name}</a>
          <div className="shell-header__actions">
            {view === "portfolio" && <ContentProvider view={portfolio}><QuickLinks /></ContentProvider>}
            <nav className="view-tabs" aria-label="View">
              <a href="?" aria-current={view === "portfolio" ? "page" : undefined}>Portfolio</a>
              <a href="?view=arcade" aria-current={view === "arcade" ? "page" : undefined}>Arcade</a>
            </nav>
          </div>
        </div>
        {view === "portfolio" && <ContentProvider view={portfolio}><SectionNav /></ContentProvider>}
      </header>
      {view === "arcade" ? (
        <Suspense fallback={<main id="content" className="content-page">Loading the arcade…</main>}>
          <Arcade />
        </Suspense>
      ) : <Portfolio />}
    </>
  );
}

function Portfolio() {
  useLayoutEffect(() => {
    const hash = window.location.hash.slice(1);
    try {
      document.getElementById(decodeURIComponent(hash))?.scrollIntoView({ block: "start" });
    } catch {
      // Ignore malformed percent escapes in manually entered links.
    }
  }, []);

  return (
    <ContentProvider view={portfolio}>
      <main id="content">
        <IdentityCard />
        <div className="content-page"><ProfileContent /></div>
      </main>
    </ContentProvider>
  );
}
