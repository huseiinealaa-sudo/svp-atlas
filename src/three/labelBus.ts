import { useMemo } from 'react';

import { PARTS, type Part } from '../data/parts';
import { useStore } from '../store/useStore';
import { LABEL_THRESHOLD } from './explode';

/**
 * The seam between the label chips (DOM, outside the Canvas) and the leader lines
 * and projection maths (inside it) — SPEC.md §7, "Above 5 % explode, thin leader
 * lines to floating labels showing OEM number + English name."
 *
 * Why a module-level registry rather than React state: a label has to follow its
 * part through every orbit frame, and pushing 93 screen positions through React
 * sixty times a second would cost more than the entire rest of the scene. So the
 * chips are *rendered* by React — rarely, only when the set of labelled parts
 * changes — and *moved* by `Labels.tsx` writing straight to the nodes it finds
 * here. React owns what exists; the frame loop owns where it sits.
 */

/** part id → the chip element currently rendered for it. */
export const labelNodes = new Map<string, HTMLElement>();

export function registerLabelNode(id: string, node: HTMLElement | null): void {
  if (node === null) labelNodes.delete(id);
  else labelNodes.set(id, node);
}

const NONE: Part[] = [];

/**
 * Which rows are labelled right now. Both sides of the seam call this, so the
 * chips and the leader lines can never disagree about the set.
 *
 * Labels are gated on explode alone, as §7 specifies. A hidden system has nothing
 * to point at, and while a part is isolated everything else is at 0.05 opacity —
 * labelling faded parts would bury the one the user asked to look at.
 */
export function useLabelledParts(): Part[] {
  const on = useStore((s) => s.explode > LABEL_THRESHOLD);
  const hiddenSystems = useStore((s) => s.hiddenSystems);
  const isolatedId = useStore((s) => s.isolatedId);

  return useMemo(() => {
    if (!on) return NONE;
    return PARTS.filter(
      (part) =>
        !hiddenSystems.includes(part.system) &&
        (isolatedId === null || isolatedId === part.id),
    );
  }, [on, hiddenSystems, isolatedId]);
}
