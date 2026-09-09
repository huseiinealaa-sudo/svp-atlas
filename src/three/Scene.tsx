import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { CAMERA_HOME, LIGHTING, PALETTE } from '../data/theme';
import { FLOW_TUBE, mm } from '../data/geometry';
import { useStore } from '../store/useStore';
import PrimitiveGallery, { GALLERY_BOX } from './PrimitiveGallery';
import { framePosition, type Box } from './framing';

/**
 * Returns the camera to its home *angle* and re-solves the distance for the current
 * viewport, on mount, on every reset, and on rotation between the two iPad
 * orientations (SPEC.md §1.6).
 */
function CameraHome({
  controls,
  box,
}: {
  controls: React.RefObject<OrbitControlsImpl>;
  box: Box;
}) {
  const token = useStore((s) => s.cameraResetToken);
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const { halfWidth, halfHeight, halfDepth } = box;

  useEffect(() => {
    if (height === 0) return;
    const position = framePosition(
      CAMERA_HOME.position,
      CAMERA_HOME.target,
      { halfWidth, halfHeight, halfDepth },
      CAMERA_HOME.fov,
      width / height,
    );
    camera.position.copy(position);
    const c = controls.current;
    if (c) {
      c.target.set(...CAMERA_HOME.target);
      c.update();
    } else {
      camera.lookAt(...CAMERA_HOME.target);
    }
  }, [token, camera, controls, width, height, halfWidth, halfHeight, halfDepth]);

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

        {/*
          Phase B — SPEC.md §11 B: the ten primitive builders, each demoed once.
          Phase C replaces this rig with <Assembly /> driven by data/parts.ts.
        */}
        <PrimitiveGallery />

        {/* Ground reference, so orbiting reads as orbiting. */}
        <gridHelper
          args={[12, 24, PALETTE.structure, PALETTE.structure]}
          position={[0, -mm(FLOW_TUBE.outerDiameter / 2) - 0.55, 0]}
        />

        <OrbitControls
          ref={controls}
          makeDefault
          target={CAMERA_HOME.target}
          enableDamping
          dampingFactor={0.08}
          minDistance={0.6}
          maxDistance={24}
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
            halfWidth: mm(GALLERY_BOX.halfWidth),
            halfHeight: mm(GALLERY_BOX.halfHeight),
            halfDepth: mm(GALLERY_BOX.halfDepth),
          }}
        />
      </Suspense>
    </Canvas>
  );
}
