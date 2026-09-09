import { useMemo } from 'react';
import * as THREE from 'three';

import { mm, mmVec } from '../../data/geometry';
import { useMaterial } from './material';
import { InstancedSet, instanceOffsets } from './instancing';
import { p, type PrimitiveProps } from './types';

/**
 * `ring` — TorusGeometry (SPEC.md §4.2).
 * O-rings, shaft seals, retaining rings, Teflon and Ryton seals.
 *
 * params (mm): diameter (seal bore, centre-to-centre) · cordDiameter · segments
 *
 * With `qty` + `instance` a whole seal stack is one `InstancedMesh` and one row —
 * "O-Ring Seal Downstream Flange" selects and explodes as a unit.
 */
export default function Ring({
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
  const radius = mm(p(params, 'diameter', 200) / 2);
  const cord = mm(p(params, 'cordDiameter', 10) / 2);
  const radialSegments = p(params, 'radialSegments', 12);
  const tubularSegments = p(params, 'segments', 64);

  // Elastomer, not steel: low metalness, high roughness.
  const material = useMaterial({
    color,
    metalness: 0.1,
    roughness: 0.85,
    opacity,
    emissive,
    emissiveIntensity,
  });

  const geometry = useMemo(() => {
    const torus = new THREE.TorusGeometry(radius, cord, radialSegments, tubularSegments);
    // TorusGeometry lies in the XY plane; stand it up normal to +X, the flow axis.
    torus.rotateY(Math.PI / 2);
    return torus;
  }, [radius, cord, radialSegments, tubularSegments]);

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
