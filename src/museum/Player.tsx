// The first-person camera. Each frame: read input, move, apply look,
// keep the player inside the walkable area, update the camera.

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EYE_HEIGHT, applyLook, clampDelta, stepPlayer, type PlayerState } from "./movement";
import { consumeLook, currentMove, type InputState } from "./input";

export type Constrain = (from: PlayerState, to: PlayerState) => PlayerState;

/** Lets the UI read and set the visitor's position (map, "go to" shortcuts). */
export interface PlayerHandle {
  get?: () => PlayerState;
  place?: (next: PlayerState) => void;
}

export function Player({
  input,
  start,
  constrain,
  onMove,
  handle,
}: {
  input: InputState;
  start: PlayerState;
  /** Applies walls/collisions to a proposed move. */
  constrain: Constrain;
  /** Called after every frame with the new state (for prompts, map, etc.). */
  onMove?: (state: PlayerState) => void;
  handle?: PlayerHandle;
}) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const state = useRef<PlayerState>(start);

  useEffect(() => {
    if (!handle) return;
    handle.get = () => ({ ...state.current });
    handle.place = (next) => {
      state.current = { ...next };
    };
  }, [handle]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    // Development-only hook for automated browser checks.
    (window as unknown as { __museum?: unknown }).__museum = {
      get state() {
        return { ...state.current };
      },
      /** Last frame's draw calls and triangles, to track scene cost. */
      get render() {
        return { calls: gl.info.render.calls, triangles: gl.info.render.triangles };
      },
      /** Put the visitor at an exact spot, so checks don't depend on timing. */
      place(next: Partial<PlayerState>) {
        state.current = { ...state.current, ...next };
      },
    };
  }, [gl]);

  useFrame((_, delta) => {
    const dt = clampDelta(delta);
    const look = consumeLook(input);
    const proposed = applyLook(stepPlayer(state.current, currentMove(input), dt), look.dx, look.dy);
    state.current = constrain(state.current, proposed);
    const s = state.current;
    camera.position.set(s.x, EYE_HEIGHT, s.z);
    camera.rotation.set(s.pitch, s.yaw, 0, "YXZ");
    onMove?.(s);
  });

  return null;
}
