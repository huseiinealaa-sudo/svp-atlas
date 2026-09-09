import { SITE } from '../data/siteData';

/**
 * SPEC.md §7 — the Human Atlas header: status dot, product name, identity line.
 * The live piece count replaces the phase chip once `parts.ts` exists (Phase C).
 */
export default function Header() {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-edge bg-panel/80 px-4 py-3 backdrop-blur">
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
          {SITE.manufacturer} · {SITE.model} · {SITE.tag}
        </p>
      </div>

      <span className="shrink-0 rounded-full border border-edge px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">
        Phase A · Skeleton
      </span>
    </header>
  );
}
