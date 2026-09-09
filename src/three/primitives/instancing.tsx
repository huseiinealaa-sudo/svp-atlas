import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';

import { SCENE_SCALE } from '../../data/geometry';
import type { InstanceSpec } from './types';

/**
 * SPEC.md §4.2 — "A 20-bolt flange set is one part row and one draw call, but still
 * selects and explodes as a unit."
 *
 * The pattern is computed in millimetres and converted to scene units here, at the
 * render boundary (SPEC.md §1.5). Instances are translation-only: each primitive
 * orients its own geometry along the pattern axis before handing it over, so the
 * matrices stay trivial and the whole set shares one rotation.
 */
export function instanceOffsets(qty: number, instance?: InstanceSpec): THREE.Vector3[] {
  const count = Math.max(1, Math.floor(qty));
  if (!instance || count === 1) return [new THREE.Vector3(0, 0, 0)];

  const axis = instance.axis ?? 'x';
  const offsets: THREE.Vector3[] = [];

  if (instance.pattern === 'circle') {
    const radius = (instance.radius ?? 0) * SCENE_SCALE;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const a = Math.cos(angle) * radius;
      const b = Math.sin(angle) * radius;
      // The circle lies in the plane normal to `axis`.
      if (axis === 'x') offsets.push(new THREE.Vector3(0, a, b));
      else if (axis === 'y') offsets.push(new THREE.Vector3(a, 0, b));
      else offsets.push(new THREE.Vector3(a, b, 0));
    }
    return offsets;
  }

  // linear: centred on the part origin so the set explodes about its own middle.
  const spacing = (instance.spacing ?? 0) * SCENE_SCALE;
  const start = -((count - 1) / 2) * spacing;
  for (let i = 0; i < count; i += 1) {
    const d = start + i * spacing;
    if (axis === 'x') offsets.push(new THREE.Vector3(d, 0, 0));
    else if (axis === 'y') offsets.push(new THREE.Vector3(0, d, 0));
    else offsets.push(new THREE.Vector3(0, 0, d));
  }
  return offsets;
}

interface InstancedSetProps {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  offsets: THREE.Vector3[];
  visible?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
}

/**
 * One `InstancedMesh` for a whole repeated set. Pointer events on any instance
 * report the set — which is exactly what a part row wants: tapping any bolt of a
 * flange set selects "Flange Retaining Bolt Set".
 */
export function InstancedSet({
  geometry,
  material,
  offsets,
  visible = true,
  castShadow = true,
  receiveShadow = true,
  onClick,
  onPointerOver,
  onPointerOut,
}: InstancedSetProps) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    offsets.forEach((offset, i) => {
      dummy.position.copy(offset);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [offsets, dummy, geometry]);

  return (
    <instancedMesh
      ref={ref}
      // `key` forces a rebuild when the count changes — InstancedMesh cannot grow.
      key={offsets.length}
      args={[geometry, material, offsets.length]}
      visible={visible}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    />
  );
}
