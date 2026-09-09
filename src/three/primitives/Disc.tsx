import { useMemo } from 'react';
import * as THREE from 'three';

import { mm, mmVec } from '../../data/geometry';
import { useMaterial } from './material';
import { InstancedSet, instanceOffsets } from './instancing';
import { p, type PrimitiveProps } from './types';

/**
 * `disc` — a short CylinderGeometry (SPEC.md §4.2).
 * Flanges, stops, retainers, washers, Belleville retainer washers.
 *
 * params (mm): diameter · thickness · boreDiameter · segments
 *
 * A `boreDiameter > 0` makes it an annulus — which is what a flange or a washer
 * actually is. Built along +X, the flow axis.
 *
 * With `instance` the row becomes a repeated set through one `InstancedMesh` — the
 * Sprocket Set is two discs 2.4 m apart, not a stack. Without `instance`, `qty > 1`
 * stacks copies face to face, which is what a washer pack is.
 */
export default function Disc({
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
    clip,
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

  const offsets = useMemo(() => instanceOffsets(qty, instance), [qty, instance]);

  // The lathe/cylinder profile is built about +Y; bake the turn onto +X into the
  // geometry so the instanced copies need translation only.
  const axial = useMemo(() => {
    const g = geometry.clone();
    g.rotateZ(Math.PI / 2);
    return g;
  }, [geometry]);

  return (
    <group
      position={mmVec(position)}
      rotation={rotation}
      visible={visible}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {instance ? (
        <InstancedSet geometry={axial} material={material} offsets={offsets} />
      ) : (
        <>
          <mesh geometry={axial} material={material} castShadow receiveShadow />
          {/* Without `instance`, `qty` means a stack: a Belleville pack, a washer pack. */}
          {qty > 1 &&
            Array.from({ length: qty - 1 }, (_, i) => (
              <mesh
                key={i}
                geometry={axial}
                material={material}
                position={[thickness * (i + 1), 0, 0]}
                castShadow
                receiveShadow
              />
            ))}
        </>
      )}
    </group>
  );
}
