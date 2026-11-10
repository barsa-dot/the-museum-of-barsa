import { describe, expect, it } from "vitest";
import {
  MAX_PITCH,
  TURN_SPEED,
  WALK_SPEED,
  actionForKey,
  applyLook,
  clampDelta,
  combineInputs,
  inputFromActions,
  stepPlayer,
  type Action,
  type PlayerState,
} from "./movement";

const origin: PlayerState = { x: 0, z: 0, yaw: 0, pitch: 0 };
const none = { forward: 0, strafe: 0, turn: 0 };

describe("keyboard mapping", () => {
  it.each([
    ["KeyW", "forward"], ["ArrowUp", "forward"], ["KeyS", "back"], ["ArrowDown", "back"],
    ["KeyA", "left"], ["KeyD", "right"], ["ArrowLeft", "turnLeft"], ["ArrowRight", "turnRight"],
  ])("%s → %s", (code, action) => expect(actionForKey(code)).toBe(action));

  it("ignores other keys", () => {
    expect(actionForKey("KeyX")).toBeNull();
    expect(actionForKey("Space")).toBeNull();
  });

  it("cancels opposite keys", () => {
    expect(inputFromActions(new Set<Action>(["forward", "back", "left"]))).toEqual({ forward: 0, strafe: -1, turn: 0 });
  });
});

describe("stepPlayer", () => {
  it("walks forward along -Z at walking speed", () => {
    const next = stepPlayer(origin, { ...none, forward: 1 }, 1);
    expect(next.x).toBeCloseTo(0);
    expect(next.z).toBeCloseTo(-WALK_SPEED);
  });

  it("strafes right along +X", () => {
    const next = stepPlayer(origin, { ...none, strafe: 1 }, 1);
    expect(next.x).toBeCloseTo(WALK_SPEED);
    expect(next.z).toBeCloseTo(0);
  });

  it("moves relative to the facing direction", () => {
    // Facing left (yaw +90°), forward is -X.
    const next = stepPlayer({ ...origin, yaw: Math.PI / 2 }, { ...none, forward: 1 }, 1);
    expect(next.x).toBeCloseTo(-WALK_SPEED);
    expect(next.z).toBeCloseTo(0);
  });

  it("is never faster diagonally", () => {
    const next = stepPlayer(origin, { ...none, forward: 1, strafe: 1 }, 1);
    expect(Math.hypot(next.x, next.z)).toBeCloseTo(WALK_SPEED);
  });

  it("keeps analogue input proportional", () => {
    const next = stepPlayer(origin, { ...none, forward: 0.5 }, 1);
    expect(next.z).toBeCloseTo(-WALK_SPEED / 2);
  });

  it("turns with keyboard input", () => {
    expect(stepPlayer(origin, { ...none, turn: 1 }, 0.5).yaw).toBeCloseTo(TURN_SPEED / 2);
  });

  it("does not change pitch", () => {
    expect(stepPlayer({ ...origin, pitch: 0.3 }, { ...none, forward: 1 }, 1).pitch).toBe(0.3);
  });
});

describe("look and timing", () => {
  it("turns left when the mouse moves left", () => {
    expect(applyLook(origin, -100, 0).yaw).toBeGreaterThan(0);
  });

  it("clamps pitch so the view never flips", () => {
    expect(applyLook(origin, 0, -1e6).pitch).toBeCloseTo(MAX_PITCH);
    expect(applyLook(origin, 0, 1e6).pitch).toBeCloseTo(-MAX_PITCH);
  });

  it("limits large frame gaps", () => {
    expect(clampDelta(5)).toBe(0.1);
    expect(clampDelta(-1)).toBe(0);
    expect(clampDelta(0.016)).toBe(0.016);
  });

  it("combines keyboard and joystick input without exceeding full speed", () => {
    expect(combineInputs({ forward: 1, strafe: 0, turn: 0 }, { forward: 0.8, strafe: -0.4, turn: 0 })).toEqual({
      forward: 1, strafe: -0.4, turn: 0,
    });
  });
});
