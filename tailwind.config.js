/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // SPEC.md §10 — visual design. Single source of truth for the UI shell.
        // The 3D system colours live in src/data/theme.ts.
        //
        // Each token resolves to a CSS custom property so the dark / light switch
        // (Phase D) is one attribute on <html> rather than a second set of classes
        // on every element. The channel triples and the reasoning behind the light
        // counterparts are in src/index.css and src/data/theme.ts — the values are
        // the §10 palette and its own family's light ramp, not a new palette.
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        panel: 'rgb(var(--c-panel) / <alpha-value>)',
        edge: 'rgb(var(--c-edge) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        text: 'rgb(var(--c-text) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        arabic: ['"IBM Plex Sans Arabic"', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      minHeight: {
        touch: '44px', // SPEC.md §1.6 — minimum hit target
      },
      minWidth: {
        touch: '44px',
      },
      height: {
        touch: '44px',
      },
      width: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
