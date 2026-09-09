import { useEffect } from 'react';

import { SURFACE } from '../data/theme';
import { useStore } from '../store/useStore';

/**
 * Puts the dark / light setting where CSS can see it.
 *
 * The shell's colours are custom properties keyed off `data-theme` on the root
 * element (`src/index.css`), so the whole interface repaints from one attribute
 * instead of every component carrying a second set of classes.
 *
 * Nothing here is persisted. SPEC.md §1.2 forbids `localStorage` and every other
 * browser store, so the setting lives in the zustand store for the life of the tab
 * and the application always opens on the §10 palette.
 */
export default function ThemeSync() {
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    // The iOS status bar sits directly above the header on an iPad in standalone
    // mode; left dark it would frame a light interface with a black band.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', SURFACE[theme].background);
  }, [theme]);

  return null;
}
