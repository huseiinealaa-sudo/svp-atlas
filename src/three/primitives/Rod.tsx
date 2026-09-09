import { useMemo } from 'react';
import * as THREE from 'three';

import { mm, mmVec } from '../../data/geometry';
import { useMaterial } from './material';
import { instanceOffsets } from './instancing';
import { Repeated } from './repeat';
import { p, type PrimitiveProps } from './types';

/**
 * `rod` — a long, thin CylinderGeometry (SPEC.md §4.2).
 * Piston shafts, Bearing Guide Bars, studs, ground straps.
 *
 * params (mm): diameter · length · endDiameter · segments
 *
 * `endDiameter` tapers the far end when a shaft steps down. Built along +X.
 * `qty` + `instance` repeat the row — the Bearing Guide Bars are two parallel bars
 * under one part number.
 */
export default function Rod({
  params,
  color,
  position = [0, 0, 0],
  rotation,
  qty = 1,
  instance,
  opacity = 1,
  emissive,
  emissiveIntensity,
  clip = false,
  visible = true,
  onClick,
  onPointerOver,
  onPointerOut,
}: PrimitiveProps) {
  const radius = mm(p(params, 'diameter', 40) / 2);
  const endRadius = mm(p(params, 'endDiameter', p(params, 'diameter', 40)) / 2);
  const length = mm(p(params, 'length', 600));
  const segments = p(params, 'segments', 24);

  const material = useMaterial({
    color,
    metalness: 0.7,
    roughness: 0.3,
    opacity,
    emissive,
    emissiveIntensity,
    clip,
  });

  const geometry = useMemo(
    () => new THREE.CylinderGeometry(endRadius, radius, length, segments),
    [radius, endRadius, length, segments],
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
        <group rotation={[0, 0, -Math.PI / 2]}>
          <mesh geometry={geometry} material={material} castShadow receiveShadow />
        </group>
      </Repeated>
    </group>
  );
}
