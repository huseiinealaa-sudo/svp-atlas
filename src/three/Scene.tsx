import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { CAMERA_HOME, LIGHTING, PALETTE } from '../data/theme';
import { FLOW_TUBE, mm } from '../data/geometry';
import { useStore } from '../store/useStore';

/**
 * Phase A placeholder geometry: the Flow Tube as a single cylinder.
 *
 * CylinderGeometry is built along +Y, so it is rotated onto +X — the direction of
 * flow (SPEC.md §4.3). Dimensions come from `data/geometry.ts` and are converted
 * here, at the render boundary, and nowhere else (SPEC.md §1.5).
 *
 * This becomes a `tube` primitive row in Phase B / C. It is not a component per part.
 */
function FlowTubePlaceholder() {
  return (
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
      <cylinderGeometry
        args={[
          mm(FLOW_TUBE.outerDiameter / 2),
          mm(FLOW_TUBE.outerDiameter / 2),
          mm(FLOW_TUBE.length),
          64,
          1,
          true,
        ]}
      />
      <meshStandardMaterial
        color={PALETTE.flowTube}
        metalness={0.55}
        roughness={0.42}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** Returns the OrbitControls to the home pose whenever the store token changes. */
function CameraHome({ controls }: { controls: React.RefObject<OrbitControlsImpl> }) {
  const token = useStore((s) => s.cameraResetToken);

  useEffect(() => {
    if (token === 0) return; // skip the initial mount; the camera is already home
    const c = controls.current;
    if (!c) return;
    c.object.position.set(...CAMERA_HOME.position);
    c.target.set(...CAMERA_HOME.target);
    c.update();
  }, [token, controls]);

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
          shadow-camera-far={30}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
        />
        <directionalLight position={LIGHTING.fillPosition} intensity={LIGHTING.fillIntensity} />

        <FlowTubePlaceholder />

        {/* Ground reference, so orbiting reads as orbiting. */}
        <gridHelper
          args={[12, 24, PALETTE.structure, PALETTE.structure]}
          position={[0, -mm(FLOW_TUBE.outerDiameter / 2) - 0.35, 0]}
        />

        <OrbitControls
          ref={controls}
          makeDefault
          target={CAMERA_HOME.target}
          enableDamping
          dampingFactor={0.08}
          minDistance={0.6}
          maxDistance={16}
          // One finger orbits, two fingers pinch-zoom and pan — the iPad gestures
          // a user expects. SPEC.md §1.6.
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
        />
        <CameraHome controls={controls} />
      </Suspense>
    </Canvas>
  );
}
