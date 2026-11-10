// Museum map: a discreet floor plan with a "you are here" marker, a list of
// rooms to go to, a way back to the atrium, and recruiter shortcuts that open
// content directly. The drawing is decorative; everything it shows is also in
// the lists beside it, so it works with a keyboard and a screen reader.

import { useEffect, useRef } from "react";
import type { PlayerState } from "./movement";
import { ATRIUM_DESTINATION, ROOM_DESTINATIONS, type Destination, type Shortcut } from "./navigation";
import { ATRIUM, columnPositions } from "./scene/atriumLayout";
import { CORRIDORS, ROOM_PLANS } from "./scene/plan";

const VIEW = { minX: -38, minZ: -40, w: 76, h: 80 };

/** Room name centred in its rectangle; longer names wrap onto two lines. */
function RoomLabel({ name, x, y }: { name: string; x: number; y: number }) {
  const words = name.split(" ");
  const lines = name.length > 10 && words.length > 1 ? [words.slice(0, -1).join(" "), words[words.length - 1]!] : [name];
  return (
    <text className="museum-map__label" x={x} y={y - (lines.length - 1) * 1.2} textAnchor="middle">
      {lines.map((line, i) => (
        <tspan key={line} x={x} dy={i === 0 ? 0 : 2.4}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function Plan({ player }: { player: PlayerState | null }) {
  const fx = player ? -Math.sin(player.yaw) : 0;
  const fz = player ? -Math.cos(player.yaw) : 0;
  return (
    <svg className="museum-map__plan" viewBox={`${VIEW.minX} ${VIEW.minZ} ${VIEW.w} ${VIEW.h}`} aria-hidden="true" focusable="false">
      {CORRIDORS.map((c) => (
        <rect key={c.id} className="museum-map__corridor" x={c.rect.minX} y={c.rect.minZ} width={c.rect.maxX - c.rect.minX} height={c.rect.maxZ - c.rect.minZ} />
      ))}
      <rect className="museum-map__room" x={-ATRIUM.half} y={-ATRIUM.half} width={ATRIUM.half * 2} height={ATRIUM.half * 2} />
      <circle className="museum-map__pool" cx={0} cy={0} r={ATRIUM.pool.radius} />
      {columnPositions().map((p, i) => (
        <circle key={i} className="museum-map__column" cx={p.x} cy={p.z} r={0.5} />
      ))}
      {ROOM_PLANS.map((r) => (
        <g key={r.room.id}>
          <rect
            className={`museum-map__room${r.open ? " museum-map__room--open" : ""}`}
            x={r.rect.minX}
            y={r.rect.minZ}
            width={r.rect.maxX - r.rect.minX}
            height={r.rect.maxZ - r.rect.minZ}
          />
          <RoomLabel name={r.room.name.replace(/^The /, "")} x={(r.rect.minX + r.rect.maxX) / 2} y={(r.rect.minZ + r.rect.maxZ) / 2} />
        </g>
      ))}
      <text className="museum-map__label" x={0} y={-ATRIUM.half + 3.2} textAnchor="middle">
        Atrium
      </text>
      {player && (
        <g className="museum-map__you">
          <line x1={player.x} y1={player.z} x2={player.x + fx * 3.2} y2={player.z + fz * 3.2} />
          <circle cx={player.x} cy={player.z} r={1.1} />
        </g>
      )}
    </svg>
  );
}

export function MapDialog({
  location,
  player,
  shortcuts,
  onGo,
  onShortcut,
  onClose,
}: {
  location: string;
  player: PlayerState | null;
  shortcuts: readonly Shortcut[];
  onGo: (destination: Destination) => void;
  onShortcut: (shortcut: Extract<Shortcut, { kind: "panel" }>) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal?.();
    const onCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [onClose]);

  return (
    <dialog ref={ref} className="museum-map" aria-labelledby="museum-map-title">
      <header className="exhibit-panel__head">
        <h2 id="museum-map-title" className="exhibit-panel__title">
          Museum map
        </h2>
        <button type="button" className="exhibit-panel__close" onClick={onClose} aria-label="Close map">
          Close <kbd>Esc</kbd>
        </button>
      </header>
      <div className="museum-map__body">
        <div className="museum-map__drawing">
          <Plan player={player} />
          <p className="museum-map__here">
            You are in: <strong>{location}</strong>
          </p>
        </div>
        <div className="museum-map__lists">
          <section aria-labelledby="museum-map-quick">
            <h3 id="museum-map-quick" className="museum-map__heading">
              Quick access
            </h3>
            <ul className="museum-map__list">
              {shortcuts.map((s) => (
                <li key={s.id}>
                  {s.kind === "panel" && (
                    <button type="button" className="museum-map__go" onClick={() => onShortcut(s)}>
                      {s.label}
                    </button>
                  )}
                  {s.kind === "link" && (
                    <a className="museum-map__go" href={s.href} download>
                      {s.label}
                    </a>
                  )}
                  {s.kind === "unavailable" && (
                    <span className="museum-map__unavailable">
                      {s.label}: {s.note}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="museum-map-rooms">
            <h3 id="museum-map-rooms" className="museum-map__heading">
              Go to a room
            </h3>
            <ul className="museum-map__list">
              {[ATRIUM_DESTINATION, ...ROOM_DESTINATIONS].map((d) => (
                <li key={d.id}>
                  <button type="button" className="museum-map__go" onClick={() => onGo(d)} aria-current={d.name === location ? "location" : undefined}>
                    {d.id === "atrium" ? "Back to the Grand Atrium" : d.name}
                    <span className="museum-map__theme">{d.theme}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </dialog>
  );
}
