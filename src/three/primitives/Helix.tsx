import { useMemo } from 'react';
import * as THREE from 'three';

import { mm, mmVec } from '../../data/geometry';
import { useMaterial } from './material';
import { instanceOffsets } from './instancing';
import { Repeated } from './repeat';
import { p, type PrimitiveProps } from './types';

/**
 * `helix` — CatmullRomCurve3 + TubeGeometry (SPEC.md §4.2).
 * Piston Spring, Belleville stacks shown as coils, and the two Return Chains —
 * a chain is a helix of zero pitch radius, i.e. a straight swept run.
 *
 * params (mm): diameter (coil mean) · wireDiameter · length · turns · segments
 *
 * The coil axis is +X, so a spring on a piston shaft needs no rotation.
 */
export default function Helix({
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
  const coilR = mm(p(params, 'diameter', 120) / 2);
  const wireR = mm(p(params, 'wireDiameter', 12) / 2);
  const length = mm(p(params, 'length', 300));
  const turns = p(params, 'turns', 8);
  const segmentsPerTurn = p(params, 'segments', 24);

  const material = useMaterial({
    color,
    metalness: 0.75,
    roughness: 0.3,
    opacity,
    emissive,
    emissiveIntensity,
  });

  const geometry = useMemo(() => {
    const steps = Math.max(8, Math.round(turns * segmentsPerTurn));
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const angle = t * turns * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          -length / 2 + t * length,
          Math.cos(angle) * coilR,
          Math.sin(angle) * coilR,
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, steps, wireR, 8, false);
  }, [coilR, wireR, length, turns, segmentsPerTurn]);

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
        <mesh geometry={geometry} material={material} castShadow receiveShadow />
      </Repeated>
    </group>
  );
}
