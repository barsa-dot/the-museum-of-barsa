export const maze = [
  "###############",
  "#.............#",
  "#.###.#.#.###.#",
  "#.....#.#.....#",
  "###.#.....#.###",
  "#...#.###.#...#",
  "#.#.....#...#.#",
  "#.###.#.#.###.#",
  "#.....#.......#",
  "#.............#",
  "###############",
] as const;

export const columns = maze[0].length;
export const rows = maze.length;
export const walls = maze.flatMap((row, y) => [...row].flatMap((cell, x) => cell === "#" ? [y * columns + x] : []));
const wallSet = new Set(walls);
const starts = [columns + 1, columns + 2] as const;
const rivalStarts = [9 * columns + 13, 8 * columns + 9] as const;
const steps = { up: -columns, down: columns, left: -1, right: 1 };
export type Direction = keyof typeof steps;
export type Seats = 1 | 2;
type Player = { cell: number; score: number };
export type Round = {
  players: Player[];
  rivals: number[];
  dots: ReadonlySet<number>;
  lives: number;
  turn: number;
  status: "ready" | "playing" | "paused" | "won" | "lost";
};

export function newRound(seats: Seats, status: Round["status"] = "ready"): Round {
  const players = starts.slice(0, seats).map((cell) => ({ cell, score: 0 }));
  const empty = new Set<number>([...starts, ...rivalStarts]);
  const dots = new Set(Array.from({ length: rows * columns }, (_, cell) => cell)
    .filter((cell) => !wallSet.has(cell) && !empty.has(cell)));
  return { players, rivals: [...rivalStarts], dots, lives: 3, turn: 0, status };
}

function nextStep(from: number, target: number): number {
  if (from === target) return from;
  const seen = new Set([from]);
  const queue = [{ cell: from, first: from }];
  for (const { cell, first } of queue) {
    for (const distance of Object.values(steps)) {
      const next = cell + distance;
      if (seen.has(next) || wallSet.has(next)) continue;
      const route = cell === from ? next : first;
      if (next === target) return route;
      seen.add(next);
      queue.push({ cell: next, first: route });
    }
  }
  return from;
}

export function advance(round: Round, directions: readonly (Direction | null)[]): Round {
  if (round.status !== "playing" || directions.every((direction) => direction === null)) return round;
  const dots = new Set(round.dots);
  const players = round.players.map(({ cell, score }, index) => {
    const direction = directions[index];
    const target = direction ? cell + steps[direction] : cell;
    const next = wallSet.has(target) ? cell : target;
    return { cell: next, score: score + (dots.delete(next) ? 10 : 0) };
  });
  const turn = round.turn + 1;
  const rivals = round.rivals.map((cell, index) => (
    turn % (index === 0 ? 3 : 4) === 0 ? nextStep(cell, players[index % players.length]!.cell) : cell
  ));
  if (dots.size === 0) return { ...round, players, rivals, dots, turn, status: "won" };

  const hit = players.some(({ cell }, player) => rivals.includes(cell) || (
    rivals.some((rival, index) => round.rivals[index] === cell && rival === round.players[player]?.cell)
  ));
  if (!hit) return { ...round, players, rivals, dots, turn };

  const lives = round.lives - 1;
  const resetPlayers = players.map((player, index) => ({ ...player, cell: starts[index]! }));
  return { players: resetPlayers, rivals: [...rivalStarts], dots, lives, turn, status: lives ? "playing" : "lost" };
}
