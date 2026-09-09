import { useMemo } from 'react';
import * as THREE from 'three';

import { mm, mmVec } from '../../data/geometry';
import { useMaterial } from './material';
import { instanceOffsets } from './instancing';
import { Repeated } from './repeat';
import { p, type PrimitiveProps } from './types';

/**
 * `cone` — a tapered cylinder (SPEC.md §4.2).
 * The **Poppet** and every tapered seat.
 *
 * params (mm): diameter (large end) · tipDiameter (small end) · length · segments
 *
 * The taper points along **+X, downstream**, which is the direction the Poppet
 * seats — it closes at LAUNCH and reopens on line pressure (SPEC.md §8).
 *
 * `qty` + `instance` (linear, along the row's own axis) stack the row: a Belleville
 * Spring is a truncated cone, and it is fitted six or eight high.
 */
export default function Cone({
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
  const baseR = mm(p(params, 'diameter', 300) / 2);
  const tipR = mm(p(params, 'tipDiameter', 0) / 2);
  const length = mm(p(params, 'length', 140));
  const segments = p(params, 'segments', 48);

  const material = useMaterial({
    color,
    metalness: 0.6,
    roughness: 0.35,
    opacity,
    emissive,
    emissiveIntensity,
    clip,
  });

  // Closed at both ends: a Poppet is solid, and an open base would show through
  // the seat when the cutaway view clips the flow tube in Phase D.
  const geometry = useMemo(
    () => new THREE.CylinderGeometry(tipR, baseR, length, segments, 1, false),
    [baseR, tipR, length, segments],
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
      {/* +Y → +X so the small end faces downstream. */}
      <Repeated offsets={offsets}>
        <group rotation={[0, 0, -Math.PI / 2]}>
          <mesh geometry={geometry} material={material} castShadow receiveShadow />
        </group>
      </Repeated>
    </group>
  );
}
