import { useMemo } from 'react';
import * as THREE from 'three';

import { mm, mmVec } from '../../data/geometry';
import { useMaterial } from './material';
import { instanceOffsets } from './instancing';
import { Repeated } from './repeat';
import { p, type PrimitiveProps } from './types';

/**
 * `pipe` — CatmullRomCurve3 + TubeGeometry (SPEC.md §4.2).
 * Inlet and outlet process piping, 10" 600# on SVP-PR-8.
 *
 * params (mm): bore · wall · length (the +X run) · rise (+Y) · lateral (+Z) ·
 *               loop (0 or 1) · segments
 *
 * A straight row is `rise = lateral = 0`. Any non-zero rise or lateral bends the
 * run into a swept elbow — which is why the piping is a curve and not a cylinder.
 * Drawn with a bore: outer wall and inner wall, DoubleSide, so a cut end reads as
 * pipe rather than as a solid bar.
 *
 * `loop: 1` closes the path into a racetrack `length` long and `rise` tall, centred
 * on the row's position: that is a **Return Chain** running around its two
 * sprockets, which no open sweep can describe. A chain sets `bore: 0`, and a zero
 * bore drops the inner wall — an open path with no bore is a solid rod, not a pipe.
 */
export default function Pipe({
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
  const bore = mm(p(params, 'bore', 254));
  const wall = mm(p(params, 'wall', 20));
  const length = mm(p(params, 'length', 1200));
  const rise = mm(p(params, 'rise', 0));
  const lateral = mm(p(params, 'lateral', 0));
  const tubularSegments = p(params, 'segments', 48);
  const isLoop = p(params, 'loop', 0) >= 1;

  const material = useMaterial({
    color,
    metalness: 0.5,
    roughness: 0.5,
    opacity,
    emissive,
    emissiveIntensity,
    clip,
    side: THREE.DoubleSide,
  });

  const curve = useMemo(() => {
    if (isLoop) {
      // A racetrack: two straight runs joined by two half turns, centred on the row.
      // The arcs are sampled rather than cornered — four control points around a
      // closed curve make TubeGeometry's frames flip, and the chain comes out as a
      // twisted ribbon instead of a loop.
      const turnR = rise / 2;
      const straight = Math.max(length / 2 - turnR, turnR);
      const ARC_STEPS = 10;
      const points: THREE.Vector3[] = [];

      points.push(new THREE.Vector3(-straight, turnR, 0));
      points.push(new THREE.Vector3(straight, turnR, 0));
      for (let i = 1; i < ARC_STEPS; i += 1) {
        const a = Math.PI / 2 - (i / ARC_STEPS) * Math.PI; // +90° → −90°
        points.push(
          new THREE.Vector3(straight + Math.cos(a) * turnR, Math.sin(a) * turnR, 0),
        );
      }
      points.push(new THREE.Vector3(straight, -turnR, 0));
      points.push(new THREE.Vector3(-straight, -turnR, 0));
      for (let i = 1; i < ARC_STEPS; i += 1) {
        const a = -Math.PI / 2 - (i / ARC_STEPS) * Math.PI; // −90° → −270°
        points.push(
          new THREE.Vector3(-straight + Math.cos(a) * turnR, Math.sin(a) * turnR, 0),
        );
      }
      return new THREE.CatmullRomCurve3(points, true, 'centripetal');
    }
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(length * 0.45, 0, 0),
      new THREE.Vector3(length * 0.8, rise * 0.35, lateral * 0.35),
      new THREE.Vector3(length, rise, lateral),
    ];
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }, [length, rise, lateral, isLoop]);

  const outer = useMemo(
    () => new THREE.TubeGeometry(curve, tubularSegments, bore / 2 + wall, 32, isLoop),
    [curve, tubularSegments, bore, wall, isLoop],
  );
  const inner = useMemo(
    () =>
      bore > 0
        ? new THREE.TubeGeometry(curve, tubularSegments, bore / 2, 32, isLoop)
        : null,
    [curve, tubularSegments, bore, isLoop],
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
        <mesh geometry={outer} material={material} castShadow receiveShadow />
        {inner && <mesh geometry={inner} material={material} />}
      </Repeated>
    </group>
  );
}
