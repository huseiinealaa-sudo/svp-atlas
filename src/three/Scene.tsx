import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { CAMERA_HOME, LIGHTING, PALETTE } from '../data/theme';
import { OVERALL, EST, mm, mmVec } from '../data/geometry';
import { useStore } from '../store/useStore';
import Assembly from './Assembly';
import { ASSEMBLY_BOUNDS } from '../data/parts';
import { framePosition, type Box } from './framing';

/**
 * Returns the camera to its home *angle* and re-solves the distance for the current
 * viewport, on mount, on every reset, and on rotation between the two iPad
 * orientations (SPEC.md §1.6).
 */
function CameraHome({
  controls,
  box,
  target,
}: {
  controls: React.RefObject<OrbitControlsImpl>;
  box: Box;
  /** Scene units. The machine's centre, not the world origin: the skid sits 0.9 m
   *  below the bore and the piping runs 2.3 m each way, so framing about [0,0,0]
   *  would hang the model off the bottom of the screen. */
  target: [number, number, number];
}) {
  const token = useStore((s) => s.cameraResetToken);
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const { halfWidth, halfHeight, halfDepth } = box;
  const [tx, ty, tz] = target;

  useEffect(() => {
    if (height === 0) return;
    const centre: [number, number, number] = [tx, ty, tz];
    const position = framePosition(
      CAMERA_HOME.position,
      centre,
      { halfWidth, halfHeight, halfDepth },
      CAMERA_HOME.fov,
      width / height,
    );
    camera.position.copy(position);
    const c = controls.current;
    if (c) {
      c.target.set(tx, ty, tz);
      c.update();
    } else {
      camera.lookAt(tx, ty, tz);
    }
  }, [token, camera, controls, width, height, halfWidth, halfHeight, halfDepth, tx, ty, tz]);

  return null;
}

export default function Scene() {
  const controls = useRef<OrbitControlsImpl>(null);

  return (
    <Canvas
      dpr={[1, 2]}
      shadows
      camera={{ position: CAMERA_HOME.position, fov: CAMERA_HOME.fov, near: 0.05, far: 200 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(PALETTE.background);
        scene.background = new THREE.Color(PALETTE.background);
      }}
      // The canvas owns every touch gesture on it; the page never scrolls or
      // rubber-bands underneath the model. SPEC.md §1.6 — touch-first.
      style={{ touchAction: 'none' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={LIGHTING.ambientIntensity} />
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

        {/* Ground reference, so orbiting reads as orbiting. */}
        {/* Ground plane at the underside of the base skid, so orbiting reads as
            orbiting and the machine reads as standing on something. */}
        <gridHelper
          args={[16, 32, PALETTE.structure, PALETTE.structure]}
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
        <CameraHome
          controls={controls}
          box={{
            halfWidth: mm(ASSEMBLY_BOUNDS.halfWidth),
            halfHeight: mm(ASSEMBLY_BOUNDS.halfHeight),
            halfDepth: mm(ASSEMBLY_BOUNDS.halfDepth),
          }}
          target={mmVec(ASSEMBLY_BOUNDS.centre)}
        />
      </Suspense>
    </Canvas>
  );
}
