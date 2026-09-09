import { useCallback, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

import { PARTS, isCutawayPart } from '../data/parts';
import type { Part } from '../data/parts';
import { HIGHLIGHT } from '../data/theme';
import { useStore } from '../store/useStore';
import { explodedScenePosition } from './explode';
import { PRIMITIVES } from './primitives';

/**
 * The assembled machine — SPEC.md §4.1.
 *
 * This component has one job: map over the part table and hand each row to the
 * primitive it names. It knows nothing about any individual part, and it must stay
 * that way. If a part needs special handling, the fix is a parameter on its
 * primitive, never a branch here and never a component of its own (SPEC.md §1.3).
 *
 * Phase D hangs all of §7 off this same loop — selection, hover, isolation,
 * per-system visibility, cutaway and explode — because every one of those reads a
 * field the row already carries. Phase F will drive the moving parts from here too.
 *
 * **Why explode is driven imperatively.** Everything else here changes when the
 * user taps something, so it goes through React. Explode changes on every frame of
 * a drag, and re-rendering 93 components per frame is how a 60 fps target on an
 * iPad (SPEC.md §10) turns into a 20 fps one. So each row's outer group is
 * positioned by `ExplodeDriver` in a single `useFrame`, and React never sees the
 * slider move. That also happens to be what makes the round trip exact: the driver
 * recomputes each position from the frozen `part.position` rather than nudging a
 * live transform, so 0 → 100 → 0 lands on the original numbers bit for bit
 * (SPEC.md §11 D, proven by `scripts/verify-explode.ts`).
 */

/** The map the driver writes into: part id → the group that carries that row. */
type GroupRegistry = Map<string, THREE.Group>;

function PartMesh({
  part,
  register,
}: {
  part: Part;
  register: (id: string, group: THREE.Group | null) => void;
}) {
  const Primitive = PRIMITIVES[part.primitive];

  const selected = useStore((s) => s.selectedId === part.id);
  const hovered = useStore((s) => s.hoveredId === part.id);
  const hidden = useStore((s) => s.hiddenSystems.includes(part.system));
  const dimmed = useStore((s) => s.isolatedId !== null && s.isolatedId !== part.id);
  const clip = useStore((s) => s.cutaway && isCutawayPart(part.id));

  const onClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      // A dimmed part lets the tap through to whatever is behind it: at 0.05 opacity
      // it is scenery, and stopping the ray here would make an isolated part
      // unselectable whenever something faded sits in front of it.
      if (dimmed) return;
      event.stopPropagation();
      useStore.getState().select(part.id);
    },
    [dimmed, part.id],
  );

  const onPointerOver = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (dimmed) return;
      event.stopPropagation();
      useStore.getState().hover(part.id);
      document.body.style.cursor = 'pointer';
    },
    [dimmed, part.id],
  );

  const onPointerOut = useCallback(() => {
    // Only the part that owns the hover may clear it. Pointer-out arrives after the
    // next part's pointer-over when the cursor slides between two meshes.
    if (useStore.getState().hoveredId === part.id) {
      useStore.getState().hover(null);
      document.body.style.cursor = '';
    }
  }, [part.id]);

  const emissive = selected ? HIGHLIGHT.selected : hovered ? HIGHLIGHT.hovered : undefined;
  const emissiveIntensity = selected
    ? HIGHLIGHT.selectedIntensity
    : hovered
      ? HIGHLIGHT.hoveredIntensity
      : 0;

  // The outer group carries the explode offset in scene units; the primitive draws
  // at its own origin. Position is written imperatively and is deliberately not a
  // prop — declaring it here would let React fight the driver for it every frame.
  return (
    <group ref={(group) => register(part.id, group)}>
      <Primitive
        params={part.params}
        color={part.color}
        rotation={part.rotation}
        qty={part.qty}
        instance={part.instance}
        opacity={dimmed ? HIGHLIGHT.dimmedOpacity : 1}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        clip={clip}
        visible={!hidden}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      />
    </group>
  );
}

/**
 * Writes every row's explode offset once per frame, and only when the fraction has
 * actually moved — at rest this costs one float comparison for the whole assembly.
 */
function ExplodeDriver({ groups }: { groups: React.MutableRefObject<GroupRegistry> }) {
  const applied = useRef<number>(Number.NaN);

  useFrame(() => {
    const t = useStore.getState().explode;
    if (t === applied.current) return;
    applied.current = t;

    for (const part of PARTS) {
      const group = groups.current.get(part.id);
      if (!group) continue;
      const [x, y, z] = explodedScenePosition(part, t);
      group.position.set(x, y, z);
    }
  });

  return null;
}

export default function Assembly() {
  const groups = useRef<GroupRegistry>(new Map());

  const register = useCallback((id: string, group: THREE.Group | null) => {
    if (group === null) {
      groups.current.delete(id);
      return;
    }
    groups.current.set(id, group);
    // Place it correctly on mount rather than waiting for the first frame, so the
    // model never appears assembled for a frame while the slider says otherwise.
    const part = PARTS.find((candidate) => candidate.id === id);
    if (part) {
      const [x, y, z] = explodedScenePosition(part, useStore.getState().explode);
      group.position.set(x, y, z);
    }
  }, []);

  const rows = useMemo(() => PARTS, []);

  return (
    <group>
      {rows.map((part) => (
        <PartMesh key={part.id} part={part} register={register} />
      ))}
      <ExplodeDriver groups={groups} />
    </group>
  );
}
