import { expect, it } from "vitest";
import { advance, columns, maze, newRound, walls } from "./maze";

it("starts both players, blocks walls, and tracks their scores independently", () => {
  const round = newRound(2, "playing");
  const next = advance(round, ["down", "right"]);
  expect(next.players[0]).toEqual({ cell: round.players[0]!.cell + columns, score: 10 });
  expect(next.players[1]).toEqual({ cell: round.players[1]!.cell + 1, score: 10 });
  expect(advance(round, ["left", "up"]).players).toEqual(round.players);
});

it("loses a shared life on contact and resets both positions", () => {
  const round = newRound(2, "playing");
  const rival = round.players[0]!.cell + columns;
  const next = advance({ ...round, rivals: [rival] }, ["down", null]);
  expect(next.lives).toBe(2);
  expect(next.players.map(({ cell }) => cell)).toEqual(round.players.map(({ cell }) => cell));
});

it("ends the round when all sparks are collected", () => {
  const round = newRound(1, "playing");
  expect(advance({ ...round, dots: new Set([round.players[0]!.cell + columns]) }, ["down"]).status).toBe("won");
});

it("has a rectangular board and every spark can be reached from the solo start", () => {
  expect(maze.every((row) => row.length === columns)).toBe(true);
  const round = newRound(1);
  const queue = [round.players[0]!.cell];
  const seen = new Set(queue);
  const blocked = new Set(walls);
  for (const cell of queue) {
    for (const offset of [-columns, columns, -1, 1]) {
      const next = cell + offset;
      if (!blocked.has(next) && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  expect([...round.dots].every((cell) => seen.has(cell))).toBe(true);
});
