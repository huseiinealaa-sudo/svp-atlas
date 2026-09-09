import { create } from 'zustand';

import { PARTS, SYSTEMS, type Part, type SystemId } from '../data/parts';
import type { ThemeId } from '../data/theme';

/**
 * Application state. SPEC.md §1.2 — in memory only.
 * No localStorage, no sessionStorage, no IndexedDB, no cookies. Ever.
 *
 * Phase D fills this out with everything §7 needs: selection, hover, isolation,
 * per-system visibility, search, explode, cutaway and camera requests.
 *
 * Two shapes here are deliberate and worth keeping:
 *
 *   - **`hiddenSystems` is an array, not a Set.** ~93 mesh components subscribe to
 *     this store, and zustand compares selector results by identity. A Set mutated
 *     in place never looks changed; a new array on every toggle always does.
 *   - **Camera moves are requests, not state.** A component inside the Canvas owns
 *     the camera; the UI outside it can only ask. Each request carries a token that
 *     increments even when the request repeats, so tapping "Front" twice re-frames
 *     rather than doing nothing.
 */

export type ViewId = 'iso' | 'front' | 'side' | 'top';

/** What the camera has been asked to look at. */
export interface CameraRequest {
  view: ViewId;
  /** Frame this part rather than the whole assembly. */
  partId: string | null;
  /** Bumped on every request so a repeat still fires. */
  token: number;
}

export interface AtlasState {
  /* --- selection ------------------------------------------------------- */
  selectedId: string | null;
  hoveredId: string | null;
  /** SPEC.md §7 — the isolated part is opaque, everything else drops to 0.05. */
  isolatedId: string | null;

  /* --- exploration ----------------------------------------------------- */
  /** 0 assembled → 1 every piece. SPEC.md §7. */
  explode: number;
  hiddenSystems: SystemId[];
  query: string;
  cutaway: boolean;

  /* --- presentation ---------------------------------------------------- */
  theme: ThemeId;

  /* --- camera ---------------------------------------------------------- */
  camera: CameraRequest;

  /* --- actions --------------------------------------------------------- */
  select: (id: string | null) => void;
  /** Select and frame — what a search result and a label tap both do. */
  selectAndFrame: (id: string) => void;
  hover: (id: string | null) => void;
  isolate: (id: string) => void;
  clearIsolate: () => void;
  setExplode: (t: number) => void;
  toggleSystem: (system: SystemId) => void;
  setAllSystems: (visible: boolean) => void;
  setQuery: (query: string) => void;
  toggleCutaway: () => void;
  toggleTheme: () => void;
  setView: (view: ViewId) => void;
  resetCamera: () => void;
  /** The reset-all button: back to the state the application boots in. */
  resetAll: () => void;
}

const INITIAL = {
  selectedId: null,
  hoveredId: null,
  isolatedId: null,
  explode: 0,
  hiddenSystems: [] as SystemId[],
  query: '',
  cutaway: false,
  theme: 'dark' as ThemeId,
};

const ALL_SYSTEMS = SYSTEMS.map((s) => s.id);

/** Clamp the slider input. A range input can hand back 1.0000000000000002. */
const clamp01 = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : t);

export const useStore = create<AtlasState>((set) => ({
  ...INITIAL,
  camera: { view: 'iso', partId: null, token: 0 },

  select: (id) => set({ selectedId: id }),

  selectAndFrame: (id) =>
    set((s) => ({
      selectedId: id,
      // Framing a part while another one is isolated would leave the user looking
      // at a part they cannot see, so isolation follows the selection.
      isolatedId: s.isolatedId === null ? null : id,
      camera: { view: s.camera.view, partId: id, token: s.camera.token + 1 },
    })),

  hover: (id) => set({ hoveredId: id }),

  isolate: (id) =>
    set((s) => ({
      isolatedId: id,
      selectedId: id,
      camera: { view: s.camera.view, partId: id, token: s.camera.token + 1 },
    })),

  clearIsolate: () =>
    set((s) => ({
      isolatedId: null,
      camera: { view: s.camera.view, partId: null, token: s.camera.token + 1 },
    })),

  setExplode: (t) => set({ explode: clamp01(t) }),

  toggleSystem: (system) =>
    set((s) => {
      const hidden = s.hiddenSystems.includes(system)
        ? s.hiddenSystems.filter((id) => id !== system)
        : [...s.hiddenSystems, system];
      // A part you can no longer see must not stay selected or isolated: the info
      // card would describe a part that is not on screen.
      const goneDark = (id: string | null) => {
        if (id === null) return null;
        const part = PARTS.find((candidate) => candidate.id === id);
        return part && hidden.includes(part.system) ? null : id;
      };
      return {
        hiddenSystems: hidden,
        selectedId: goneDark(s.selectedId),
        isolatedId: goneDark(s.isolatedId),
      };
    }),

  setAllSystems: (visible) =>
    set(
      visible
        ? { hiddenSystems: [] }
        : { hiddenSystems: [...ALL_SYSTEMS], selectedId: null, isolatedId: null },
    ),

  setQuery: (query) => set({ query }),

  toggleCutaway: () => set((s) => ({ cutaway: !s.cutaway })),

  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  setView: (view) =>
    set((s) => ({
      camera: { view, partId: s.isolatedId, token: s.camera.token + 1 },
    })),

  resetCamera: () =>
    set((s) => ({ camera: { view: 'iso', partId: null, token: s.camera.token + 1 } })),

  resetAll: () =>
    set((s) => ({
      ...INITIAL,
      // The theme is a viewing preference, not part of the exploration state —
      // resetting the model should not throw the user back into the dark.
      theme: s.theme,
      camera: { view: 'iso', partId: null, token: s.camera.token + 1 },
    })),
}));

/* ------------------------------------------------------------------ selectors */

/** Convenience for components that need the whole selected row, not just its id. */
export const partById = (id: string | null): Part | undefined =>
  id === null ? undefined : PARTS.find((part) => part.id === id);

/** How a part should be drawn right now, given selection and isolation. */
export type PartMode = 'normal' | 'dimmed' | 'focused';

export const partMode = (state: AtlasState, id: string): PartMode => {
  if (state.isolatedId === null) return 'normal';
  return state.isolatedId === id ? 'focused' : 'dimmed';
};

/** Read the explode fraction without subscribing — for per-frame consumers. */
export const currentExplode = (): number => useStore.getState().explode;
