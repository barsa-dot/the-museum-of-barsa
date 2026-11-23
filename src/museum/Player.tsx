import { useEffect, useRef } from "react";
import type { Group } from "three";
import { MathUtils } from "three";
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
  const figure = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
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
    const offset = 3.4;
    const cameraFoot = showVisitor
      ? constrain(s, { ...s, x: s.x + Math.sin(s.yaw) * offset, z: s.z + Math.cos(s.yaw) * offset })
      : s;
    const distance = Math.hypot(cameraFoot.x - s.x, cameraFoot.z - s.z);
    camera.position.set(cameraFoot.x, EYE_HEIGHT + distance * 0.27, cameraFoot.z);
    const pitch = showVisitor ? Math.max(-0.85, Math.min(0.6, s.pitch - distance * 0.09)) : s.pitch;
    camera.rotation.set(pitch, s.yaw, 0, "YXZ");

    if (visitor.current && figure.current && leftLeg.current && rightLeg.current && leftArm.current && rightArm.current) {
      visitor.current.visible = distance > 0.65;
      visitor.current.position.set(s.x, 0, s.z);
      const dx = s.x - previous.x;
      const dz = s.z - previous.z;
      const moved = Math.hypot(dx, dz);
      const facing = moved > 0.001 ? Math.atan2(-dx, -dz) : s.yaw;
      const turn = Math.atan2(Math.sin(facing - figure.current.rotation.y), Math.cos(facing - figure.current.rotation.y));
      figure.current.rotation.y += reduceMotion.current ? turn : MathUtils.damp(0, turn, 12, dt);
      stride.current += moved * 8;
      const swing = moved > 0.001 && !reduceMotion.current ? Math.sin(stride.current) * 0.48 : 0;
      const step = reduceMotion.current ? 0 : MathUtils.damp(leftLeg.current.rotation.x, swing, 22, dt);
      leftLeg.current.rotation.x = step;
      rightLeg.current.rotation.x = -step;
      leftArm.current.rotation.x = -step * 0.68;
      rightArm.current.rotation.x = step * 0.68;
      figure.current.position.y = Math.abs(step) * 0.045;
    }
    onMove?.(s);
  });

  if (!showVisitor) return null;

  return (
    <group ref={visitor} visible={false}>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.7, 1]}>
        <circleGeometry args={[0.27, 20]} />
        <meshBasicMaterial color="#24111C" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <group ref={figure}>
        <mesh position={[0, 1.32, 0]}>
          <sphereGeometry args={[0.155, 12, 8]} />
          <meshStandardMaterial color="#351625" />
        </mesh>
        <mesh position={[0, 0.88, 0]} scale={[1, 1, 0.73]}>
          <capsuleGeometry args={[0.2, 0.35, 4, 10]} />
          <meshStandardMaterial color="#75213E" />
        </mesh>
        <mesh position={[0, 1.14, 0]}>
          <cylinderGeometry args={[0.11, 0.13, 0.075, 10]} />
          <meshStandardMaterial color="#C8EA43" />
        </mesh>
        <mesh position={[0, 0.9, 0.16]} scale={[1, 1, 0.43]}>
          <capsuleGeometry args={[0.13, 0.16, 3, 8]} />
          <meshStandardMaterial color="#52172D" />
        </mesh>
        {[leftLeg, rightLeg].map((leg, index) => (
          <group key={index} ref={leg} position={[index === 0 ? -0.105 : 0.105, 0.62, 0]}>
            <mesh position={[0, -0.26, 0]}>
              <capsuleGeometry args={[0.074, 0.38, 4, 8]} />
              <meshStandardMaterial color="#351625" />
            </mesh>
            <mesh position={[0, -0.55, -0.035]} scale={[1, 0.58, 1.5]}>
              <sphereGeometry args={[0.081, 8, 6]} />
              <meshStandardMaterial color="#F4D7DF" />
            </mesh>
          </group>
        ))}
        {[leftArm, rightArm].map((arm, index) => (
          <group key={index} ref={arm} position={[index === 0 ? -0.22 : 0.22, 1.04, 0]}>
            <mesh position={[0, -0.16, 0]}>
              <capsuleGeometry args={[0.064, 0.26, 4, 8]} />
              <meshStandardMaterial color="#75213E" />
            </mesh>
            <mesh position={[0, -0.34, 0]}>
              <sphereGeometry args={[0.053, 8, 6]} />
              <meshStandardMaterial color="#F4D7DF" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
