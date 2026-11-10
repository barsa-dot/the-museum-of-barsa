import { describe, expect, it } from "vitest";
import { JOYSTICK_DEADZONE, joystickInput, knobOffset } from "./touch";

const R = 60;

describe("joystickInput", () => {
  it("does nothing inside the dead zone", () => {
    expect(joystickInput(0, 0, R)).toEqual({ forward: 0, strafe: 0, turn: 0 });
    expect(joystickInput(R * JOYSTICK_DEADZONE * 0.9, 0, R).strafe).toBe(0);
  });

  it("walks forward at full speed when pushed up to the rim", () => {
    const m = joystickInput(0, -R, R);
    expect(m.forward).toBeCloseTo(1);
    expect(m.strafe).toBeCloseTo(0);
  });

  it("walks back when pulled down and strafes when pushed sideways", () => {
    expect(joystickInput(0, R, R).forward).toBeCloseTo(-1);
    expect(joystickInput(R, 0, R).strafe).toBeCloseTo(1);
    expect(joystickInput(-R, 0, R).strafe).toBeCloseTo(-1);
  });

  it("is analogue: half-way is slower", () => {
    const half = joystickInput(0, -R / 2, R).forward;
    expect(half).toBeGreaterThan(0.2);
    expect(half).toBeLessThan(0.6);
  });

  it("never exceeds full speed beyond the rim, including diagonals", () => {
    const m = joystickInput(R * 3, -R * 3, R);
    expect(Math.hypot(m.forward, m.strafe)).toBeCloseTo(1);
  });

  it("never turns (looking is a separate drag)", () => {
    expect(joystickInput(30, -30, R).turn).toBe(0);
  });
});

describe("knobOffset", () => {
  it("follows the thumb inside the pad and stops at the rim", () => {
    expect(knobOffset(10, -20, R)).toEqual({ x: 10, y: -20 });
    const k = knobOffset(0, -200, R);
    expect(k.x).toBeCloseTo(0);
    expect(k.y).toBeCloseTo(-R);
  });
});
