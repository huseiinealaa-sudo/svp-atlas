import { useMemo } from 'react';
import * as THREE from 'three';

import { mm, mmVec } from '../../data/geometry';
import { useMaterial } from './material';
import { p, type PrimitiveProps } from './types';

/**
 * `probe` — cylinder + stem (SPEC.md §4.2).
 * The two **Optical Volume Switches** (Detector 1 and Detector 2), the Prover and
 * Switch Bar RTDs, the pressure transmitter, the motor stop micro switch.
 *
 * params (mm): diameter · length (body) · stemDiameter · stemLength
 *
 * Built along **+Y**: body above, stem reaching down into the process. A detector
 * row rotates this to look across the path the **Flag** travels — the detectors
 * never see the piston, only the Flag (CLAUDE.md, the one insight).
 *
 * `emissive` is how a detector lamp lights green when it triggers in Phase F.
 */
export default function Probe({
  params,
  color,
  position = [0, 0, 0],
  rotation,
  opacity = 1,
  emissive,
  emissiveIntensity,
  visible = true,
  onClick,
  onPointerOver,
  onPointerOut,
}: PrimitiveProps) {
  const bodyR = mm(p(params, 'diameter', 46) / 2);
  const bodyLen = mm(p(params, 'length', 130));
  const stemR = mm(p(params, 'stemDiameter', p(params, 'diameter', 46) * 0.45) / 2);
  const stemLen = mm(p(params, 'stemLength', 0));
  const segments = p(params, 'segments', 20);

  const material = useMaterial({
    color,
    metalness: 0.5,
    roughness: 0.4,
    opacity,
    emissive,
    emissiveIntensity,
  });

  const body = useMemo(
    () => new THREE.CylinderGeometry(bodyR, bodyR, bodyLen, segments),
    [bodyR, bodyLen, segments],
  );
  const stem = useMemo(
    () => new THREE.CylinderGeometry(stemR, stemR, stemLen, segments),
    [stemR, stemLen, segments],
  );

  return (
    <group
      position={mmVec(position)}
      rotation={rotation}
      visible={visible}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <mesh geometry={body} material={material} castShadow receiveShadow />
      {stemLen > 0 && (
        <mesh
          geometry={stem}
          material={material}
          position={[0, -(bodyLen / 2 + stemLen / 2), 0]}
          castShadow
          receiveShadow
        />
      )}
    </group>
  );
}
