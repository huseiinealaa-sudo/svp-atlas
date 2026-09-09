import { useMemo } from 'react';
import * as THREE from 'three';

import { mm, mmVec } from '../../data/geometry';
import { useMaterial } from './material';
import { p, type PrimitiveProps } from './types';

/**
 * `pipe` — CatmullRomCurve3 + TubeGeometry (SPEC.md §4.2).
 * Inlet and outlet process piping, 10" 600# on SVP-PR-8.
 *
 * params (mm): bore · wall · length (the +X run) · rise (+Y) · lateral (+Z) · segments
 *
 * A straight row is `rise = lateral = 0`. Any non-zero rise or lateral bends the
 * run into a swept elbow — which is why the piping is a curve and not a cylinder.
 * Drawn with a bore: outer wall and inner wall, DoubleSide, so a cut end reads as
 * pipe rather than as a solid bar.
 */
export default function Pipe({
  params,
  color,
  position = [0, 0, 0],
  rotation,
  opacity = 1,
  emissive,
  emissiveIntensity,
  visible = true,
  onClick,
  onPointerOver,
  onPointerOut,
}: PrimitiveProps) {
  const bore = mm(p(params, 'bore', 254));
  const wall = mm(p(params, 'wall', 20));
  const length = mm(p(params, 'length', 1200));
  const rise = mm(p(params, 'rise', 0));
  const lateral = mm(p(params, 'lateral', 0));
  const tubularSegments = p(params, 'segments', 48);

  const material = useMaterial({
    color,
    metalness: 0.5,
    roughness: 0.5,
    opacity,
    emissive,
    emissiveIntensity,
    side: THREE.DoubleSide,
  });

  const curve = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(length * 0.45, 0, 0),
      new THREE.Vector3(length * 0.8, rise * 0.35, lateral * 0.35),
      new THREE.Vector3(length, rise, lateral),
    ];
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }, [length, rise, lateral]);

  const outer = useMemo(
    () => new THREE.TubeGeometry(curve, tubularSegments, bore / 2 + wall, 32, false),
    [curve, tubularSegments, bore, wall],
  );
  const inner = useMemo(
    () => new THREE.TubeGeometry(curve, tubularSegments, bore / 2, 32, false),
    [curve, tubularSegments, bore],
  );

  return (
    <group
      position={mmVec(position)}
      rotation={rotation}
      visible={visible}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <mesh geometry={outer} material={material} castShadow receiveShadow />
      <mesh geometry={inner} material={material} />
    </group>
  );
}
