// App shell: the mode chooser on first visit, otherwise the chosen mode.

import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { profile, projects, viewFor } from "../data/profile";
import type { Mode } from "../data/profile/presentation";
import type { ModeStore } from "../state/mode";
import { ContentProvider, ProfileContent } from "../content/components";
import { ModeChooser } from "./ModeChooser";
import { ModeSwitch, currentSectionId } from "./ModeSwitch";
import { DeveloperHero } from "../modes/developer/DeveloperHero";
import { IdentityCard } from "../modes/business/IdentityCard";
import { SectionNav } from "./SectionNav";
import { QuickLinks } from "./QuickLinks";
import { exitMuseum, navigateToView, urlForView, useView } from "../state/view";

// The 3D museum is a separate bundle, downloaded only when a visitor enters it.
const MuseumView = lazy(() => import("../museum/MuseumView"));

export function App({ store }: { store: ModeStore }) {
  const state = useSyncExternalStore(store.subscribe, store.get, store.get);
  const view = useView();
  // Only move focus after the visitor acts, never on the initial page load.
  const [acted, setActed] = useState(false);

  if (state.mode && view === "museum") {
    return (
      <Suspense fallback={<p className="museum-loading">Loading the museum…</p>}>
        <MuseumView mode={state.mode} onExit={exitMuseum} />
      </Suspense>
    );
  }

  if (!state.mode) {
    return (
      <ModeChooser
        name={profile.person.name}
        focusOnMount={acted}
        onChoose={(mode) => {
          setActed(true);
          store.choose(mode);
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  return (
    <ModeView
      mode={state.mode}
      focusOnMount={acted}
      onSwitch={(mode) => store.choose(mode)}
      onReturnToChooser={() => {
        setActed(true);
        store.forget();
        window.scrollTo(0, 0);
      }}
    />
  );
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

function ModeView({
  mode,
  focusOnMount,
  onSwitch,
  onReturnToChooser,
}: {
  mode: Mode;
  focusOnMount: boolean;
  onSwitch: (mode: Mode) => void;
  onReturnToChooser: () => void;
}) {
  const mainRef = useRef<HTMLElement>(null);
  const keepSection = useRef<string | null>(null);

  // Each mode's identity component provides the page's <h1>.
  useEffect(() => {
    if (focusOnMount) mainRef.current?.querySelector<HTMLElement>("h1")?.focus();
  }, [focusOnMount]);

  // Links to a section (…#projects) must land on it. The browser tries to jump
  // to the hash before the app has rendered the section, so do it here once
  // the content exists.
  useLayoutEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, []);

  // After a switch, return to the section the visitor was reading.
  useLayoutEffect(() => {
    const id = keepSection.current;
    keepSection.current = null;
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [mode]);

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
            <ModeSwitch
              mode={mode}
              onSwitch={(next) => {
                keepSection.current = currentSectionId();
                onSwitch(next);
              }}
            />
          </div>
        </div>
        <SectionNav />
      </header>
      <main id="content" className="content-page" ref={mainRef}>
        {mode === "developer" ? <DeveloperHero /> : <IdentityCard />}
        <MuseumInvitation />
        <ProfileContent />
      </main>
      <footer className="shell-footer">
        {/* A terminal status line in Developer Mode, a colophon in Business Mode; decoration only. */}
        <p className="shell-footer__status" aria-hidden="true">
          {mode === "developer" ? (
            <>
              <span>~/{profile.person.name.toLowerCase().replace(/\s+/g, "-")}</span>
              <span>developer mode</span>
            </>
          ) : (
            <>
              <span>{profile.person.name}</span>
              <span>Portfolio, business edition</span>
            </>
          )}
        </p>
        <button type="button" className="shell-footer__link" onClick={onReturnToChooser}>
          Show the mode choice again
        </button>
      </footer>
    </ContentProvider>
  );
}
