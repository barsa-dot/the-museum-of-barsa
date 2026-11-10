// The walkable museum (loaded on demand, only when the visitor enters it).
//
// Desktop: W A S D / ↑ ↓ to walk, ← → to turn, mouse to look after
// "Start exploring" captures the pointer; Esc releases it (browser default).
// Touch: joystick pad to walk, drag elsewhere to look.
// Near an exhibit and facing it, a prompt offers E / Enter / tap to open an
// accessible panel with the same verified content as the portfolio pages.
// Without WebGL, or if the 3D view fails, visitors get the museum guide:
// every room with a link to its content on the portfolio pages. The map's
// quick access opens every section without walking.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { Mode } from "../data/profile/presentation";
import { EYE_HEIGHT, type PlayerState } from "./movement";
import { attachDesktopInput, createInputState } from "./input";
import { Player, type Constrain, type PlayerHandle } from "./Player";
import { MapDialog } from "./MapDialog";
import { recruiterShortcuts, type Destination, type Shortcut } from "./navigation";
import { moveWithCollisions } from "./collision";
import { nearestInteractable } from "./interaction";
import { scenePalette } from "./scene/palette";
import { Atrium } from "./scene/Atrium";
import { locate } from "./scene/atriumLayout";
import { PLAN_AREAS } from "./scene/plan";
import { buildMuseumWorld } from "./scene/museum";
import { Exhibits } from "./scene/RoomExhibits";
import { profile, projects, viewFor } from "../data/profile";
import { Rooms } from "./scene/Rooms";
import { supportsWebGL } from "./webgl";
import { Joystick, useTouchLook } from "./TouchControls";
import { prefersTouch } from "./touch";
import { ExhibitPanel } from "./ExhibitPanel";
import { MuseumGuide } from "./MuseumGuide";
import { SceneBoundary } from "./SceneBoundary";
import { PLAYER_RADIUS, type Exhibit } from "./world";


function isInteractiveTarget(target: EventTarget | null): boolean {
  const el = target as { tagName?: string } | null;
  return /^(BUTTON|A|INPUT|TEXTAREA|SELECT|SUMMARY)$/.test(el?.tagName ?? "");
}

export default function MuseumView({ mode, onExit }: { mode: Mode; onExit: () => void }) {
  const palette = useMemo(() => scenePalette(mode), [mode]);
  const world = useMemo(() => buildMuseumWorld(viewFor(profile, projects, mode)), [mode]);
  const input = useMemo(createInputState, []);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [webgl] = useState(supportsWebGL);
  // The graphics driver can drop the WebGL context mid-visit (not an error, so
  // the boundary can't catch it); the museum guide is shown instead.
  const [contextLost, setContextLost] = useState(false);
  const [touch] = useState(prefersTouch);
  const [locked, setLocked] = useState(false);
  const [lockFailed, setLockFailed] = useState(false);
  // Help shows on arrival and steps aside once the visitor starts walking;
  // the Controls button brings it back.
  const [helpOpen, setHelpOpen] = useState(true);
  const helpAutoClosed = useRef(false);
  const [nearby, setNearby] = useState<Exhibit | null>(null);
  const [open, setOpen] = useState<Exhibit | null>(null);
  const nearbyRef = useRef<Exhibit | null>(null);
  const [location, setLocation] = useState(world.name);
  const locationRef = useRef(world.name);
  const returnFocus = useRef<HTMLElement | null>(null);
  const handle = useMemo<PlayerHandle>(() => ({}), []);
  const shortcuts = useMemo(() => recruiterShortcuts(viewFor(profile, projects, mode)), [mode]);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapPlayer, setMapPlayer] = useState<PlayerState | null>(null);

  useEffect(() => attachDesktopInput(input, () => canvasRef.current), [input]);
  useTouchLook(stageRef, input);

  useEffect(() => {
    titleRef.current?.focus();
    const onChange = () => setLocked(document.pointerLockElement !== null && document.pointerLockElement === canvasRef.current);
    document.addEventListener("pointerlockchange", onChange);
    return () => {
      document.removeEventListener("pointerlockchange", onChange);
      if (document.pointerLockElement) document.exitPointerLock();
    };
  }, []);

  const constrain: Constrain = useCallback((from: PlayerState, to: PlayerState) => {
    const p = moveWithCollisions(from, to, PLAYER_RADIUS, world.colliders);
    return { ...to, x: p.x, z: p.z };
  }, [world]);

  // Runs every frame; only touches React state when something changes.
  const onMove = useCallback((state: PlayerState) => {
    // Doorways (the thickness of a wall) belong to no space: keep the last name there.
    const here = locate(PLAN_AREAS, state);
    if (here && here !== locationRef.current) {
      locationRef.current = here;
      setLocation(here);
    }
    if (!helpAutoClosed.current && Math.hypot(state.x - world.start.x, state.z - world.start.z) > 1.5) {
      helpAutoClosed.current = true;
      setHelpOpen(false);
    }
    const next = nearestInteractable(state, world.exhibits);
    if (next?.id !== nearbyRef.current?.id) {
      nearbyRef.current = next;
      setNearby(next);
    }
  }, [world]);

  const openExhibit = useCallback(
    (exhibit: Exhibit) => {
      returnFocus.current = document.activeElement as HTMLElement | null;
      input.enabled = false;
      input.actions.clear();
      if (document.pointerLockElement) document.exitPointerLock();
      setOpen(exhibit);
    },
    [input],
  );

  const closeExhibit = useCallback(() => {
    setOpen(null);
    input.enabled = true;
    const target = returnFocus.current;
    requestAnimationFrame(() => (target && document.contains(target) ? target : titleRef.current)?.focus());
  }, [input]);

  const openMap = useCallback(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    input.enabled = false;
    input.actions.clear();
    if (document.pointerLockElement) document.exitPointerLock();
    setMapPlayer(handle.get?.() ?? null);
    setMapOpen(true);
  }, [input, handle]);

  const closeMap = useCallback(() => {
    setMapOpen(false);
    input.enabled = true;
    const target = returnFocus.current;
    requestAnimationFrame(() => (target && document.contains(target) ? target : titleRef.current)?.focus());
  }, [input]);

  /** "Go to": a shortcut, not a replacement for walking. */
  const goTo = useCallback(
    (destination: Destination) => {
      handle.place?.(destination.spot);
      setMapOpen(false);
      input.enabled = true;
      requestAnimationFrame(() => titleRef.current?.focus());
    },
    [handle, input],
  );

  const openShortcut = useCallback(
    (shortcut: Extract<Shortcut, { kind: "panel" }>) => {
      setMapOpen(false);
      openExhibit({ id: `shortcut-${shortcut.id}`, label: shortcut.label, verb: "View", x: 0, z: 0, radius: 0, content: shortcut.content });
    },
    [openExhibit],
  );

  // M toggles the map, unless a panel is open or the visitor is typing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "KeyM" || event.repeat || open || event.ctrlKey || event.metaKey || event.altKey) return;
      const el = event.target as { tagName?: string } | null;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName ?? "")) return;
      event.preventDefault();
      if (mapOpen) closeMap();
      else openMap();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, mapOpen, openMap, closeMap]);

  // E (or Enter when not on a control) opens the exhibit being faced.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (open || mapOpen || !nearbyRef.current || event.repeat) return;
      if (event.code === "KeyE" || (event.key === "Enter" && !isInteractiveTarget(event.target))) {
        event.preventDefault();
        openExhibit(nearbyRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, mapOpen, openExhibit]);

  const startLooking = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas?.requestPointerLock) {
      setLockFailed(true);
      return;
    }
    setLockFailed(false);
    try {
      // Returns a promise in current browsers; older ones return undefined.
      const result = canvas.requestPointerLock() as unknown as Promise<void> | undefined;
      result?.catch(() => setLockFailed(true));
    } catch {
      setLockFailed(true);
    }
  }, []);

  return (
    <div className="museum" data-mode={mode}>
      <header className="museum__bar">
        <button type="button" className="museum__exit" onClick={onExit}>
          ← Back to portfolio
        </button>
        <h1 className="museum__title" ref={titleRef} tabIndex={-1}>
          The Museum of Barsa
        </h1>
        {webgl && !contextLost && (
          <p className="museum__location" aria-live="polite">
            <span className="visually-hidden">You are in: </span>
            {location}
          </p>
        )}
        {webgl && !contextLost && (
          <>
            <button type="button" className="museum__controls" aria-haspopup="dialog" aria-keyshortcuts="M" onClick={openMap}>
              Map
            </button>
            <button
              type="button"
              className="museum__controls"
              aria-expanded={helpOpen}
              aria-controls="museum-help"
              onClick={() => {
                helpAutoClosed.current = true;
                setHelpOpen((o) => !o);
              }}
            >
              Controls
            </button>
          </>
        )}
      </header>

      {webgl && !contextLost ? (
        <>
          <SceneBoundary
            fallback={
              <MuseumGuide
                mode={mode}
                title="The 3D museum stopped working"
                reason="Something went wrong while drawing the museum on this device."
                onExit={onExit}
              />
            }
          >
          <div className="museum__stage" ref={stageRef} onClick={() => !touch && !locked && !open && startLooking()}>
            <Canvas
              className="museum__canvas"
              dpr={[1, 1.5]}
              gl={{ antialias: true, powerPreference: "default" }}
              camera={{ fov: 70, near: 0.05, far: 110, position: [world.start.x, EYE_HEIGHT, world.start.z] }}
              onCreated={({ gl }) => {
                canvasRef.current = gl.domElement;
                gl.domElement.addEventListener("webglcontextlost", () => setContextLost(true), { once: true });
                gl.domElement.setAttribute("role", "img");
                gl.domElement.setAttribute("aria-label", "3D view of the museum. Use the keyboard to walk around.");
              }}
            >
              <color attach="background" args={[palette.background]} />
              <fog attach="fog" args={[palette.fog, 22, 75]} />
              <Atrium mode={mode} palette={palette} />
              <Rooms palette={palette} />
              <Exhibits specs={world.specs} mode={mode} palette={palette} />
              <Player input={input} start={world.start} constrain={constrain} onMove={onMove} handle={handle} />
            </Canvas>
          </div>
          </SceneBoundary>

          {/* Proximity prompt. Announced politely to screen readers. */}
          <div className="museum-prompt" aria-live="polite">
            {nearby && !open && !mapOpen && (
              <button type="button" className="museum-prompt__button" onClick={() => openExhibit(nearby)}>
                {touch ? (
                  <>Tap to {nearby.verb.toLowerCase()}: </>
                ) : (
                  <>
                    <kbd>E</kbd> {nearby.verb}:{" "}
                  </>
                )}
                <strong>{nearby.label}</strong>
              </button>
            )}
          </div>

          {touch && !open && !mapOpen && <Joystick input={input} />}

          {open && <ExhibitPanel exhibit={open} mode={mode} onClose={closeExhibit} />}

          {mapOpen && (
            <MapDialog location={location} player={mapPlayer} shortcuts={shortcuts} onGo={goTo} onShortcut={openShortcut} onClose={closeMap} />
          )}

          {touch ? (
            helpOpen && (
              <section id="museum-help" className="museum__help museum__help--touch" aria-labelledby="museum-help-title">
                <h2 id="museum-help-title" className="museum__help-title">
                  Walk through the museum
                </h2>
                <dl className="museum__keys">
                  <div>
                    <dt>Walk</dt>
                    <dd>Drag the pad in the bottom-left corner</dd>
                  </div>
                  <div>
                    <dt>Look around</dt>
                    <dd>Drag anywhere else on the screen</dd>
                  </div>
                  <div>
                    <dt>Exhibits</dt>
                    <dd>Walk up to one and tap the button that appears</dd>
                  </div>
                  <div>
                    <dt>No walking</dt>
                    <dd>The Map button opens every room's content directly</dd>
                  </div>
                </dl>
                <button type="button" className="museum__start" onClick={() => setHelpOpen(false)}>
                  Got it
                </button>
              </section>
            )
          ) : locked ? (
            <p className="museum__hint">Esc to release the mouse</p>
          ) : !helpOpen ? (
            !open && <p className="museum__hint">Click the view to look around with the mouse</p>
          ) : (
            !open && (
              <section id="museum-help" className="museum__help" aria-labelledby="museum-help-title">
                <h2 id="museum-help-title" className="museum__help-title">
                  Walk through the museum
                </h2>
                <dl className="museum__keys">
                  <div>
                    <dt>Move</dt>
                    <dd>
                      <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or <kbd>↑</kbd> <kbd>↓</kbd>
                    </dd>
                  </div>
                  <div>
                    <dt>Turn</dt>
                    <dd>
                      <kbd>←</kbd> <kbd>→</kbd>, or the mouse after you start
                    </dd>
                  </div>
                  <div>
                    <dt>Exhibits</dt>
                    <dd>
                      Walk up to one and press <kbd>E</kbd>
                    </dd>
                  </div>
                  <div>
                    <dt>Map</dt>
                    <dd>
                      <kbd>M</kbd>: also opens every room's content without walking
                    </dd>
                  </div>
                  <div>
                    <dt>Release mouse</dt>
                    <dd>
                      <kbd>Esc</kbd>
                    </dd>
                  </div>
                </dl>
                <button type="button" className="museum__start" onClick={startLooking}>
                  Start exploring
                </button>
                {lockFailed && (
                  <p className="museum__note" role="status">
                    Mouse look isn't available here. You can still walk and turn with the keyboard.
                  </p>
                )}
              </section>
            )
          )}
        </>
      ) : (
        <MuseumGuide
          mode={mode}
          title={contextLost ? "The 3D museum stopped working" : "The 3D museum can't run on this device"}
          reason={
            contextLost
              ? "This device's graphics stopped responding while drawing the museum."
              : "This browser doesn't support WebGL, which the walkable museum needs."
          }
          onExit={onExit}
        />
      )}
    </div>
  );
}
