import { useMemo } from 'react';
import * as THREE from 'three';

import { mm, mmVec } from '../../data/geometry';
import { useMaterial } from './material';
import { p, type PrimitiveProps } from './types';

/**
 * `disc` — a short CylinderGeometry (SPEC.md §4.2).
 * Flanges, stops, retainers, washers, Belleville retainer washers.
 *
 * params (mm): diameter · thickness · boreDiameter · segments
 *
 * A `boreDiameter > 0` makes it an annulus — which is what a flange or a washer
 * actually is. Built along +X, the flow axis.
 */
export default function Disc({
  params,
  color,
  position = [0, 0, 0],
  rotation,
  qty = 1,
  opacity = 1,
  emissive,
  emissiveIntensity,
  visible = true,
  onClick,
  onPointerOver,
  onPointerOut,
}: PrimitiveProps) {
  const outerR = mm(p(params, 'diameter', 200) / 2);
  const innerR = mm(p(params, 'boreDiameter', 0) / 2);
  const thickness = mm(p(params, 'thickness', 20));
  const segments = p(params, 'segments', 48);

  const material = useMaterial({
    color,
    metalness: 0.6,
    roughness: 0.4,
    opacity,
    emissive,
    emissiveIntensity,
    side: innerR > 0 ? THREE.DoubleSide : THREE.FrontSide,
  });

  const geometry = useMemo(() => {
    if (innerR <= 0) {
      return new THREE.CylinderGeometry(outerR, outerR, thickness, segments);
    }
    // An annulus: a lathed profile is one geometry instead of four meshes.
    const profile = [
      new THREE.Vector2(innerR, -thickness / 2),
      new THREE.Vector2(outerR, -thickness / 2),
      new THREE.Vector2(outerR, thickness / 2),
      new THREE.Vector2(innerR, thickness / 2),
      new THREE.Vector2(innerR, -thickness / 2),
    ];
    return new THREE.LatheGeometry(profile, segments);
  }, [outerR, innerR, thickness, segments]);

  return (
    <group
      position={mmVec(position)}
      rotation={rotation}
      visible={visible}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <group rotation={[0, 0, Math.PI / 2]}>
        <mesh geometry={geometry} material={material} castShadow receiveShadow />
      </group>
      {/* `qty` on a disc row means a stack (a Belleville stack, a washer pack). */}
      {qty > 1 &&
        Array.from({ length: qty - 1 }, (_, i) => (
          <group key={i} position={[thickness * (i + 1), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <mesh geometry={geometry} material={material} castShadow receiveShadow />
          </group>
        ))}
    </group>
  );
}
