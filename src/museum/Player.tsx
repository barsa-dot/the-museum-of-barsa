import { useEffect, useRef } from "react";
import type { Group } from "three";
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
  showVisitor,
}: {
  input: InputState;
  start: PlayerState;
  /** Applies walls/collisions to a proposed move. */
  constrain: Constrain;
  /** Called after every frame with the new state (for prompts, map, etc.). */
  onMove?: (state: PlayerState) => void;
  handle?: PlayerHandle;
  showVisitor: boolean;
}) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const state = useRef<PlayerState>(start);
  const visitor = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const stride = useRef(0);
  const reduceMotion = useRef(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { reduceMotion.current = preference.matches; };
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);

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
    const previous = state.current;
    const look = consumeLook(input);
    const proposed = applyLook(stepPlayer(state.current, currentMove(input), dt), look.dx, look.dy);
    state.current = constrain(state.current, proposed);
    const s = state.current;
    const offset = showVisitor ? 2.6 : 0;
    const cameraFoot = showVisitor
      ? constrain(s, { ...s, x: s.x + Math.sin(s.yaw) * offset, z: s.z + Math.cos(s.yaw) * offset })
      : s;
    const distance = Math.hypot(cameraFoot.x - s.x, cameraFoot.z - s.z);
    camera.position.set(cameraFoot.x, EYE_HEIGHT + distance * 0.27, cameraFoot.z);
    const pitch = showVisitor ? Math.max(-0.85, Math.min(0.6, s.pitch - distance * 0.09)) : s.pitch;
    camera.rotation.set(pitch, s.yaw, 0, "YXZ");

    if (visitor.current && leftLeg.current && rightLeg.current) {
      visitor.current.visible = distance > 0.65;
      visitor.current.position.set(s.x, 0, s.z);
      visitor.current.rotation.y = s.yaw;
      const moved = Math.hypot(s.x - previous.x, s.z - previous.z);
      stride.current += moved * 8;
      const swing = moved > 0.001 && !reduceMotion.current ? Math.sin(stride.current) * 0.48 : 0;
      leftLeg.current.rotation.x = swing;
      rightLeg.current.rotation.x = -swing;
    }
    onMove?.(s);
  });

  if (!showVisitor) return null;

  return (
    <group ref={visitor} visible={false}>
      <mesh position={[0, 1.33, 0]}>
        <sphereGeometry args={[0.14, 12, 8]} />
        <meshStandardMaterial color="#351625" />
      </mesh>
      <mesh position={[0, 0.88, 0]}>
        <capsuleGeometry args={[0.21, 0.32, 4, 10]} />
        <meshStandardMaterial color="#75213E" />
      </mesh>
      <mesh position={[0, 0.98, 0.18]}>
        <boxGeometry args={[0.29, 0.32, 0.14]} />
        <meshStandardMaterial color="#C8EA43" />
      </mesh>
      {[leftLeg, rightLeg].map((leg, index) => (
        <group key={index} ref={leg} position={[index === 0 ? -0.11 : 0.11, 0.62, 0]}>
          <mesh position={[0, -0.28, 0]}>
            <capsuleGeometry args={[0.075, 0.42, 4, 8]} />
            <meshStandardMaterial color="#351625" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
