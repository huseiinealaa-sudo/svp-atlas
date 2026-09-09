import { create } from 'zustand';

/**
 * Application state. SPEC.md §1.2 — in memory only.
 * No localStorage, no sessionStorage, no IndexedDB, no cookies. Ever.
 *
 * Phase A holds only what the skeleton needs. Selection, isolation, explode,
 * systems visibility and search arrive in Phase D.
 */
interface AtlasState {
  /** Incremented to ask OrbitControls to return the camera to its home pose. */
  cameraResetToken: number;
  resetCamera: () => void;
}

export const useStore = create<AtlasState>((set) => ({
  cameraResetToken: 0,
  resetCamera: () => set((s) => ({ cameraResetToken: s.cameraResetToken + 1 })),
}));
