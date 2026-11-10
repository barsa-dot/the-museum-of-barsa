import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { attachDesktopInput, consumeLook, createInputState, currentMove } from "./input";

// Minimal stand-ins for window/document so the listener wiring can be tested
// without a browser (pointer lock can't be granted to automated browsers).
type Listener = (event: Record<string, unknown>) => void;
function target() {
  const listeners = new Map<string, Set<Listener>>();
  return {
    addEventListener: (type: string, fn: Listener) => void (listeners.get(type) ?? listeners.set(type, new Set()).get(type)!).add(fn),
    removeEventListener: (type: string, fn: Listener) => void listeners.get(type)?.delete(fn),
    fire: (type: string, event: Record<string, unknown> = {}) => listeners.get(type)?.forEach((fn) => fn(event)),
    count: () => [...listeners.values()].reduce((n, s) => n + s.size, 0),
  };
}

const canvas = { tagName: "CANVAS" } as unknown as HTMLElement;
let win: ReturnType<typeof target>;
let doc: ReturnType<typeof target> & { pointerLockElement: unknown };

beforeEach(() => {
  win = target();
  doc = Object.assign(target(), { pointerLockElement: null as unknown });
  Object.assign(globalThis, { window: win, document: doc });
});
afterEach(() => {
  delete (globalThis as Record<string, unknown>).window;
  delete (globalThis as Record<string, unknown>).document;
});

const key = (code: string) => ({ code, preventDefault() {}, target: null, altKey: false, ctrlKey: false, metaKey: false });

describe("desktop input wiring", () => {
  it("collects mouse look only while the canvas holds the pointer lock", () => {
    const input = createInputState();
    attachDesktopInput(input, () => canvas);
    doc.fire("mousemove", { movementX: 50, movementY: 10 });
    expect(consumeLook(input)).toEqual({ dx: 0, dy: 0 });
    doc.pointerLockElement = canvas;
    doc.fire("mousemove", { movementX: 50, movementY: 10 });
    doc.fire("mousemove", { movementX: -20, movementY: 5 });
    expect(consumeLook(input)).toEqual({ dx: 30, dy: 15 });
    expect(consumeLook(input)).toEqual({ dx: 0, dy: 0 });
  });

  it("turns keys into movement and stops on key up", () => {
    const input = createInputState();
    attachDesktopInput(input, () => canvas);
    win.fire("keydown", key("KeyW"));
    win.fire("keydown", key("KeyD"));
    expect(currentMove(input)).toEqual({ forward: 1, strafe: 1, turn: 0 });
    win.fire("keyup", key("KeyW"));
    expect(currentMove(input)).toEqual({ forward: 0, strafe: 1, turn: 0 });
  });

  it("stops all movement when the window loses focus", () => {
    const input = createInputState();
    attachDesktopInput(input, () => canvas);
    win.fire("keydown", key("ArrowUp"));
    win.fire("blur");
    expect(currentMove(input)).toEqual({ forward: 0, strafe: 0, turn: 0 });
  });

  it("ignores keys and stops moving while input is disabled (e.g. a dialog is open)", () => {
    const input = createInputState();
    attachDesktopInput(input, () => canvas);
    win.fire("keydown", key("KeyW"));
    input.enabled = false;
    expect(currentMove(input)).toEqual({ forward: 0, strafe: 0, turn: 0 });
    win.fire("keydown", key("KeyD"));
    input.enabled = true;
    expect(currentMove(input).strafe).toBe(0);
  });

  it("removes every listener on cleanup", () => {
    const cleanup = attachDesktopInput(createInputState(), () => canvas);
    expect(win.count() + doc.count()).toBeGreaterThan(0);
    cleanup();
    expect(win.count() + doc.count()).toBe(0);
  });
});
