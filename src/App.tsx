import Scene from './three/Scene';
import Header from './ui/Header';
import Footer from './ui/Footer';
import ViewRail from './ui/ViewRail';
import SystemsPanel from './ui/SystemsPanel';
import InfoCard from './ui/InfoCard';
import ExplodeSlider from './ui/ExplodeSlider';
import LabelLayer from './ui/LabelLayer';
import ThemeSync from './ui/ThemeSync';

/**
 * The application shell — SPEC.md §7.
 *
 * The panels float over the viewport rather than sitting beside it, exactly as the
 * §7 mockup draws them: Systems on the left, the info card on the right, the
 * explode control centred at the bottom, the view rail on the right edge. On an
 * iPad in portrait that leaves the machine the full width of the screen instead of
 * a column between two sidebars.
 *
 * SPEC.md §6 — panels are RTL (set on <html> in index.html and again on each
 * panel); the 3D canvas stays LTR, which is why the viewport wrapper carries
 * `dir="ltr"`. English chrome and every number inside a panel is marked LTR
 * individually, the way the header line already was.
 *
 * `pointer-events-none` on the overlay grid with `pointer-events-auto` on each
 * panel is what keeps the gaps between panels draggable: the orbit gesture belongs
 * to the canvas underneath (SPEC.md §1.6).
 */
export default function App() {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-ink text-text">
      <ThemeSync />
      <Header />

      <main dir="ltr" className="relative min-h-0 flex-1">
        <Scene />
        <LabelLayer />

        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3">
          <div className="flex items-start justify-between gap-3">
            <SystemsPanel />
            {/* The view rail is absolutely placed against the right edge, so the
                info card stops short of it rather than sitting underneath. */}
            <div className="mr-[60px] flex justify-end">
              <InfoCard />
            </div>
          </div>

          <div className="flex justify-center pb-1">
            <ExplodeSlider />
          </div>
        </div>

        <ViewRail />
      </main>

      <Footer />
    </div>
  );
}
