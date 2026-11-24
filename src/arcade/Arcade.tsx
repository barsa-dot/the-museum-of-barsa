import { useEffect, useRef, useState, type CSSProperties } from "react";
import { advance, columns, newRound, rows, walls, type Direction, type Seats } from "./maze";
import "./arcade.css";

const keys: Record<string, [number, Direction]> = {
  ArrowUp: [0, "up"], ArrowDown: [0, "down"], ArrowLeft: [0, "left"], ArrowRight: [0, "right"],
  KeyW: [1, "up"], KeyS: [1, "down"], KeyA: [1, "left"], KeyD: [1, "right"],
};
const pad = [["up", "↑"], ["left", "←"], ["down", "↓"], ["right", "→"]] as const;

function at(cell: number): CSSProperties {
  return {
    left: `${(cell % columns + 0.5) * 100 / columns}%`,
    top: `${(Math.floor(cell / columns) + 0.5) * 100 / rows}%`,
  };
}

export default function Arcade() {
  const [seats, setSeats] = useState<Seats>(1);
  const [round, setRound] = useState(() => newRound(1));
  const direction = useRef<[Direction | null, Direction | null]>([null, null]);
  const playing = round.status === "playing";

  useEffect(() => {
    if (!playing) return;
    function onKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.code === "Escape") {
        setRound((current) => ({ ...current, status: "paused" }));
        return;
      }
      const input = keys[event.code];
      if (!input) return;
      const [player, heading] = input;
      event.preventDefault();
      direction.current[seats === 1 ? 0 : player] = heading;
    }
    const timer = window.setInterval(() => {
      setRound((current) => advance(current, direction.current));
    }, 155);
    const pause = () => {
      setRound((current) => current.status === "playing" ? { ...current, status: "paused" } : current);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", pause);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", pause);
    };
  }, [playing, seats]);

  function restart(players = seats) {
    direction.current = [null, null];
    setSeats(players);
    setRound(newRound(players, "playing"));
  }

  const message = round.status === "ready" ? "Choose solo or two players to start."
    : round.status === "paused" ? "Paused"
      : round.status === "won" ? "Maze cleared"
        : round.status === "lost" ? "Round over" : "Collect every spark and avoid the sentries.";

  return (
    <main id="content" className="arcade">
      <header className="arcade__header">
        <h1>Spark Run</h1>
        <p>Collect the sparks before the sentries catch you.</p>
      </header>
      <div className="arcade__controls">
        <button type="button" aria-pressed={seats === 1} onClick={() => restart(1)}>Solo</button>
        <button type="button" aria-pressed={seats === 2} onClick={() => restart(2)}>Two players</button>
        <button type="button" disabled={round.status === "ready" || round.status === "won" || round.status === "lost"} onClick={() => {
          setRound((current) => ({ ...current, status: playing ? "paused" : "playing" }));
        }}>{playing ? "Pause" : "Resume"}</button>
        <button type="button" onClick={() => restart()}>Restart</button>
      </div>
      <div className="arcade__score">
        {round.players.map((player, index) => (
          <span key={index} data-player={index + 1}>P{index + 1} <strong>{player.score}</strong></span>
        ))}
        <span>Lives <strong>{round.lives}</strong></span>
        <span>Sparks left <strong>{round.dots.size}</strong></span>
      </div>
      <div className="arcade__board" style={{ "--columns": columns, "--rows": rows } as CSSProperties} aria-label="Spark Run maze" role="img">
        {walls.map((cell) => <span key={cell} className="arcade__wall" style={at(cell)} />)}
        {[...round.dots].map((cell) => <span key={cell} className="arcade__spark" style={at(cell)} />)}
        {round.rivals.map((cell, index) => <span key={index} className="arcade__rival" style={at(cell)} />)}
        {round.players.map(({ cell }, index) => (
          <span key={index} className="arcade__player" data-player={index + 1} style={at(cell)}>{index + 1}</span>
        ))}
      </div>
      <p className="arcade__message" role="status">{message}</p>
      <p className="arcade__instructions">
        {seats === 2 ? "P1 uses arrow keys. P2 uses WASD. You share three lives." : "Use arrow keys, WASD, or the direction pad to move."}
      </p>
      <div className="arcade__pad" aria-label="Player one direction pad">
        {pad.map(([heading, arrow]) => (
          <button key={heading} type="button" disabled={!playing} aria-label={`Move ${heading}`} onClick={() => {
            direction.current[0] = heading;
          }}>{arrow}</button>
        ))}
      </div>
    </main>
  );
}
