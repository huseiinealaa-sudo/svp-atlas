import { useMemo } from 'react';
import * as THREE from 'three';

import { mm, mmVec } from '../../data/geometry';
import { useMaterial } from './material';
import { InstancedSet, instanceOffsets } from './instancing';
import { p, type PrimitiveProps } from './types';

/**
 * `bolt` — small cylinder + hex head, via InstancedMesh (SPEC.md §4.2).
 * Every bolt set in the atlas: flange retaining bolts, socket head cap screws,
 * hex head cap screws.
 *
 * params (mm): diameter · length · headDiameter · headThickness
 * instance: `{ pattern: 'circle', radius: <bolt circle>, axis: 'x' }` for a flange.
 *
 * SPEC.md §4.2 — "A 20-bolt flange set is one part row and one draw call, but
 * still selects and explodes as a unit." Shank and head are two InstancedMeshes
 * sharing one offset table, so a 20-bolt set costs two draw calls, not forty.
 */
export default function Bolt({
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
  const shankR = mm(p(params, 'diameter', 24) / 2);
  const length = mm(p(params, 'length', 110));
  const headR = mm(p(params, 'headDiameter', p(params, 'diameter', 24) * 1.7) / 2);
  const headThk = mm(p(params, 'headThickness', p(params, 'diameter', 24) * 0.7));

  const material = useMaterial({
    color,
    metalness: 0.85,
    roughness: 0.35,
    opacity,
    emissive,
    emissiveIntensity,
  });

  // Both geometries are pre-rotated onto +X and pre-translated, so the instance
  // matrices stay translation-only (see instancing.tsx).
  const shank = useMemo(() => {
    const g = new THREE.CylinderGeometry(shankR, shankR, length, 12);
    g.rotateZ(-Math.PI / 2);
    return g;
  }, [shankR, length]);

  const head = useMemo(() => {
    // 6 radial segments: a hex head, which is what makes a bolt read as a bolt.
    const g = new THREE.CylinderGeometry(headR, headR, headThk, 6);
    g.rotateZ(-Math.PI / 2);
    g.translate(-(length / 2 + headThk / 2), 0, 0);
    return g;
  }, [headR, headThk, length]);

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
      <InstancedSet geometry={shank} material={material} offsets={offsets} />
      <InstancedSet geometry={head} material={material} offsets={offsets} />
    </group>
  );
}
