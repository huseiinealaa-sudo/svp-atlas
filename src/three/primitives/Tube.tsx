import { useMemo } from 'react';
import * as THREE from 'three';

import { mm, mmVec } from '../../data/geometry';
import { useMaterial } from './material';
import { instanceOffsets } from './instancing';
import { Repeated } from './repeat';
import { p, type PrimitiveProps } from './types';

/**
 * `tube` — two concentric CylinderGeometry (SPEC.md §4.2).
 * Flow Tube, Igus Bushings, sleeves, seal retainers.
 *
 * params (mm): outerDiameter · innerDiameter · length · segments
 *
 * The cylinder is built along +Y by three.js and rotated onto **+X, the direction
 * of flow** (SPEC.md §4.3), so a row supplies no rotation for an axial part.
 */
export default function Tube({
  params,
  color,
  position = [0, 0, 0],
  rotation,
  qty = 1,
  instance,
  opacity = 1,
  emissive,
  emissiveIntensity,
  visible = true,
  onClick,
  onPointerOver,
  onPointerOut,
}: PrimitiveProps) {
  const outerR = mm(p(params, 'outerDiameter', 100) / 2);
  const innerR = mm(p(params, 'innerDiameter', 80) / 2);
  const length = mm(p(params, 'length', 200));
  const segments = p(params, 'segments', 48);

  // One DoubleSide material serves the outer wall, the bore and the end annuli,
  // so a tube is one material and four cheap draw calls.
  const material = useMaterial({
    color,
    metalness: 0.55,
    roughness: 0.42,
    opacity,
    emissive,
    emissiveIntensity,
    side: THREE.DoubleSide,
  });

  const outer = useMemo(
    () => new THREE.CylinderGeometry(outerR, outerR, length, segments, 1, true),
    [outerR, length, segments],
  );
  const inner = useMemo(
    () => new THREE.CylinderGeometry(innerR, innerR, length, segments, 1, true),
    [innerR, length, segments],
  );
  const cap = useMemo(
    () => new THREE.RingGeometry(innerR, outerR, segments),
    [innerR, outerR, segments],
  );

  const offsets = useMemo(() => instanceOffsets(qty, instance), [qty, instance]);

  return (
    <group
      position={mmVec(position)}
      rotation={rotation}
      visible={visible}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <Repeated offsets={offsets}>
        {/* +Y → +X: the tube lies along the flow axis. */}
        <group rotation={[0, 0, Math.PI / 2]}>
          <mesh geometry={outer} material={material} castShadow receiveShadow />
          {innerR > 0 && <mesh geometry={inner} material={material} castShadow receiveShadow />}
        </group>
        {innerR > 0 && (
          <>
            <mesh
              geometry={cap}
              material={material}
              position={[length / 2, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
            />
            <mesh
              geometry={cap}
              material={material}
              position={[-length / 2, 0, 0]}
              rotation={[0, -Math.PI / 2, 0]}
            />
          </>
        )}
      </Repeated>
    </group>
  );
}
