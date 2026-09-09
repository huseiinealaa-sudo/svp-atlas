import { useMemo } from 'react';
import * as THREE from 'three';

import { mm, mmVec } from '../../data/geometry';
import { useMaterial } from './material';
import { InstancedSet, instanceOffsets } from './instancing';
import { p, type PrimitiveProps } from './types';

/**
 * `box` — BoxGeometry (SPEC.md §4.2).
 * Switch Bar, **Guide Block**, **Flag**, base skid, drive end plates, enclosures,
 * shims, motor stop ramp.
 *
 * params (mm): width (X) · height (Y) · depth (Z)
 *
 * Axis-aligned to the scene: `width` runs along +X, the flow axis, so a Switch Bar
 * row needs no rotation and the Flag reads as a thin blade across the beam.
 */
export default function Box({
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
  const width = mm(p(params, 'width', 200));
  const height = mm(p(params, 'height', 100));
  const depth = mm(p(params, 'depth', 100));

  const material = useMaterial({
    color,
    metalness: 0.45,
    roughness: 0.55,
    opacity,
    emissive,
    emissiveIntensity,
  });

  const geometry = useMemo(
    () => new THREE.BoxGeometry(width, height, depth),
    [width, height, depth],
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
      <InstancedSet geometry={geometry} material={material} offsets={offsets} />
    </group>
  );
}
