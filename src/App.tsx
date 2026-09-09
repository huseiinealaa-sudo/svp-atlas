import Scene from './three/Scene';
import Header from './ui/Header';
import Footer from './ui/Footer';
import ViewRail from './ui/ViewRail';

/**
 * The application shell.
 *
 * SPEC.md §6 — panels are RTL (set on <html> in index.html); the 3D canvas stays LTR,
 * which is why the viewport wrapper carries `dir="ltr"`.
 */
export default function App() {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-ink text-text">
      <Header />

      <main dir="ltr" className="relative min-h-0 flex-1">
        <Scene />
        <ViewRail />
      </main>

      <Footer />
    </div>
  );
}
