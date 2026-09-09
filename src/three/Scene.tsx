import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { AMBIENT_BY_THEME, CAMERA_HOME, LIGHTING, SURFACE } from '../data/theme';
import { OVERALL, EST, mm } from '../data/geometry';
import { useStore } from '../store/useStore';
import Assembly from './Assembly';
import CameraDirector from './CameraDirector';
import Labels from './Labels';

/**
 * Canvas, lights, camera — SPEC.md §3.
 *
 * Phase D adds three things to the Phase A skeleton: the camera is driven by
 * `CameraDirector` rather than by a single reset effect, local clipping is enabled
 * for the Cutaway, and the background follows the dark / light setting.
 */

/**
 * The ground the machine is seen against. Kept as its own component so a theme
 * change repaints the clear colour without remounting the Canvas — remounting
 * would throw away the WebGL context and every cached material with it.
 */
function Surface() {
  const theme = useStore((s) => s.theme);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const { background } = SURFACE[theme];
    gl.setClearColor(background);
    scene.background = new THREE.Color(background);
  }, [theme, gl, scene]);

  return null;
}

export default function Scene() {
  const controls = useRef<OrbitControlsImpl>(null);
  const theme = useStore((s) => s.theme);
  const select = useStore((s) => s.select);
  const surface = SURFACE[theme];

  return (
    <Canvas
      dpr={[1, 2]}
      shadows
      camera={{ position: CAMERA_HOME.position, fov: CAMERA_HOME.fov, near: 0.05, far: 200 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(SURFACE.dark.background);
        scene.background = new THREE.Color(SURFACE.dark.background);
        // Per-material clipping, for the Cutaway. Renderer-wide clipping planes
        // would cut the Piston in half along with the Flow Tube — see
        // `three/clipping.ts`.
        gl.localClippingEnabled = true;
      }}
      // Tapping the background clears the selection, the way closing a card would.
      onPointerMissed={() => select(null)}
      // The canvas owns every touch gesture on it; the page never scrolls or
      // rubber-bands underneath the model. SPEC.md §1.6 — touch-first.
      style={{ touchAction: 'none' }}
    >
      <Suspense fallback={null}>
        <Surface />
        <ambientLight intensity={AMBIENT_BY_THEME[theme] ?? LIGHTING.ambientIntensity} />
        <directionalLight
          position={LIGHTING.keyPosition}
          intensity={LIGHTING.keyIntensity}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.5}
          shadow-camera-far={40}
          shadow-camera-left={-3.6}
          shadow-camera-right={3.6}
          shadow-camera-top={3.6}
          shadow-camera-bottom={-3.6}
        />
        <directionalLight position={LIGHTING.fillPosition} intensity={LIGHTING.fillIntensity} />

        {/* SPEC.md §4.1 — 91 rows of data/parts.ts, drawn by the ten primitives. */}
        <Assembly />

        {/* SPEC.md §7 — leader lines, above 5 % explode. */}
        <Labels />

        {/* Ground plane at the underside of the base skid, so orbiting reads as
            orbiting and the machine reads as standing on something. */}
        <gridHelper
          args={[16, 32, surface.gridAccent, surface.grid]}
          position={[0, -mm(OVERALL.centrelineHeight + EST.baseThk), 0]}
        />

        <OrbitControls
          ref={controls}
          makeDefault
          target={CAMERA_HOME.target}
          enableDamping
          dampingFactor={0.08}
          minDistance={0.6}
          maxDistance={40}
          // One finger orbits, two fingers pinch-zoom and pan — the iPad gestures
          // a user expects. SPEC.md §1.6.
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
        />
        <CameraDirector controls={controls} />
      </Suspense>
    </Canvas>
  );
}
