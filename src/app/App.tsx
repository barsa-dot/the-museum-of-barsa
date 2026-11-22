// The portfolio opens in Business unless a visitor has selected a view.

import { Suspense, lazy, useLayoutEffect, useSyncExternalStore } from "react";
import { profile, projects, viewFor } from "../data/profile";
import type { Mode } from "../data/profile/presentation";
import type { ModeStore } from "../state/mode";
import { ContentProvider, ProfileContent } from "../content/components";
import { ModeSwitch } from "./ModeSwitch";
import { IdentityCard } from "../modes/business/IdentityCard";
import { SectionNav } from "./SectionNav";
import { QuickLinks } from "./QuickLinks";
import { exitMuseum, navigateToView, urlForView, useView } from "../state/view";

// The 3D museum is a separate bundle, downloaded only when a visitor enters it.
const MuseumView = lazy(() => import("../museum/MuseumView"));

export function App({ store }: { store: ModeStore }) {
  const state = useSyncExternalStore(store.subscribe, store.get, store.get);
  const mode = state.mode ?? "business";
  const view = useView();

  if (view === "museum") {
    return (
      <Suspense fallback={<p className="museum-loading">Loading the museum…</p>}>
        <MuseumView mode={mode} onExit={exitMuseum} />
      </Suspense>
    );
  }

  return <ModeView mode={mode} onSwitch={(next) => store.choose(next)} />;
}

/** Invitation from the portfolio pages into the walkable museum. */
function MuseumInvitation() {
  const href = typeof window === "undefined" ? "?view=museum" : urlForView(window.location.href, "museum");
  return (
    <aside className="museum-cta" aria-labelledby="museum-cta-title">
      <p className="museum-cta__text">
        <span className="museum-cta__title" id="museum-cta-title">
          Walk through the museum
        </span>
        The same profile, laid out as a building you can explore.
      </p>
      <a
        className="museum-cta__link"
        href={href}
        onClick={(event) => {
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          navigateToView("museum");
        }}
      >
        Enter the museum →
      </a>
    </aside>
  );
}

function ModeView({ mode, onSwitch }: { mode: Mode; onSwitch: (mode: Mode) => void }) {
  // Links to a section (…#projects) must land on it. The browser tries to jump
  // to the hash before the app has rendered the section, so do it here once
  // the content exists.
  useLayoutEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, []);

  return (
    <ContentProvider view={viewFor(profile, projects, mode)}>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <header className="shell-header">
        <div className="shell-header__row">
          <a className="shell-header__name" href="#content">
            {profile.person.name}
          </a>
          <div className="shell-header__actions">
            <QuickLinks />
            <a className="quick-links__link" href="#portfolio-view">Change view</a>
          </div>
        </div>
        <SectionNav />
      </header>
      <main id="content" className="content-page">
        <IdentityCard modeControl={<ModeSwitch mode={mode} onSwitch={onSwitch} />} />
        <MuseumInvitation />
        <ProfileContent />
      </main>
      <footer className="shell-footer">
        {/* A terminal status line in Developer Mode, a colophon in Business Mode; decoration only. */}
        <p className="shell-footer__status" aria-hidden="true">
          {mode === "developer" ? (
            <>
              <span>~/{profile.person.name.toLowerCase().replace(/\s+/g, "-")}</span>
              <span>Tech view</span>
            </>
          ) : (
            <>
              <span>{profile.person.name}</span>
              <span>Portfolio, business edition</span>
            </>
          )}
        </p>
      </footer>
    </ContentProvider>
  );
}
