import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { ASSEMBLY_BOUNDS, PARTS, partBounds } from '../data/parts';
import { mm, mmVec } from '../data/geometry';
import { CAMERA_HOME } from '../data/theme';
import { useStore, type ViewId } from '../store/useStore';
import { explodedPosition } from './explode';
import { framePosition, type Box } from './framing';

/**
 * The one owner of the camera — SPEC.md §7, the view buttons on the right rail and
 * "Isolate part … camera frames it".
 *
 * Everything outside the Canvas asks for a camera move by bumping
 * `store.camera.token`; this component is the only thing that moves it. That keeps
 * a single code path for the reset button, the four view buttons, an isolate, and a
 * search result being framed, and it means the framing distance is always re-solved
 * for the current viewport — a distance that fits at 1366×1024 crops at 1024×1366
 * (SPEC.md §1.6), so it is solved per request rather than stored.
 */

/** Viewing directions, in scene space. The camera sits along these from the target. */
const DIRECTIONS: Record<ViewId, [number, number, number]> = {
  // Three-quarter — the home angle of SPEC.md §10's lighting rig.
  iso: CAMERA_HOME.position,
  // The machine's elevation, seen from the viewer's side. +Z is toward the viewer
  // and the drive sits at −Z (SPEC.md §4.3), so this is the face with the flow tube.
  front: [0, 0, 1],
  // Along the flow axis, looking upstream from the downstream end. +X is flow.
  side: [1, 0, 0],
  // Plan. The tiny Z bias keeps OrbitControls' azimuth defined — straight down the
  // Y axis is the one direction where "which way is up" has no answer.
  top: [0, 1, 0.0001],
};

/** A part can be a 10 mm o-ring cord; framed literally the camera ends up inside it. */
const MIN_HALF_EXTENT_MM = 90;

export default function CameraDirector({
  controls,
}: {
  controls: React.RefObject<OrbitControlsImpl>;
}) {
  const request = useStore((s) => s.camera);
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useEffect(() => {
    if (height === 0) return;

    let target: [number, number, number];
    let box: Box;

    const part = request.partId === null ? undefined : PARTS.find((p) => p.id === request.partId);

    if (part) {
      // Frame where the part actually is, which is not where its row says it is
      // once the assembly is exploded.
      const bounds = partBounds(part);
      const centreAtRest = bounds.centre;
      const [px, py, pz] = explodedPosition(part, useStore.getState().explode);
      const offset: [number, number, number] = [
        centreAtRest[0] - part.position[0],
        centreAtRest[1] - part.position[1],
        centreAtRest[2] - part.position[2],
      ];
      target = mmVec([px + offset[0], py + offset[1], pz + offset[2]]);
      box = {
        halfWidth: mm(Math.max(bounds.halfWidth, MIN_HALF_EXTENT_MM)),
        halfHeight: mm(Math.max(bounds.halfHeight, MIN_HALF_EXTENT_MM)),
        halfDepth: mm(Math.max(bounds.halfDepth, MIN_HALF_EXTENT_MM)),
      };
    } else {
      target = mmVec(ASSEMBLY_BOUNDS.centre);
      box = {
        halfWidth: mm(ASSEMBLY_BOUNDS.halfWidth),
        halfHeight: mm(ASSEMBLY_BOUNDS.halfHeight),
        halfDepth: mm(ASSEMBLY_BOUNDS.halfDepth),
      };
    }

    const direction = DIRECTIONS[request.view];
    const home: [number, number, number] = [
      target[0] + direction[0],
      target[1] + direction[1],
      target[2] + direction[2],
    ];

    const position = framePosition(home, target, box, CAMERA_HOME.fov, width / height);
    camera.position.copy(position);

    const c = controls.current;
    if (c) {
      c.target.set(target[0], target[1], target[2]);
      c.update();
    } else {
      camera.lookAt(new THREE.Vector3(target[0], target[1], target[2]));
    }
  }, [request, camera, controls, width, height]);

  return null;
}
