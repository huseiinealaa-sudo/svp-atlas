import { PART_COUNT, SYSTEMS } from '../data/parts';
import { SITE } from '../data/siteData';
import SearchBar from './SearchBar';

/**
 * SPEC.md §7 — the Human Atlas header: status dot, product name, identity line and
 * the live piece count, which is read from the part table rather than written down.
 * The component search sits in the header bar, as the §7 mockup places it.
 */
export default function Header() {
  return (
    <header className="relative z-30 flex shrink-0 items-center justify-between gap-3 border-b border-edge bg-panel/80 px-4 py-3 backdrop-blur">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-accent shadow-[0_0_10px_2px_rgba(210,153,34,0.55)]"
            aria-hidden="true"
          />
          <span className="truncate font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            Interactive Prover
          </span>
        </div>

        <h1 className="mt-1 flex items-baseline gap-2 text-lg font-semibold leading-none text-text">
          SVP Atlas
          <span className="rounded border border-edge px-1.5 py-0.5 font-mono text-[10px] text-muted">
            3D
          </span>
        </h1>

        <p className="mt-1 truncate font-mono text-[11px] text-muted" dir="ltr">
          <span className="text-text">{PART_COUNT}</span> modeled pieces ·{' '}
          <span className="text-text">{SYSTEMS.length}</span> systems ·{' '}
          {SITE.manufacturer} · {SITE.model} · {SITE.tag}
        </p>
      </div>

      <SearchBar />
    </header>
  );
}
