/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // SPEC.md §10 — visual design. Single source of truth for the UI shell.
        // The 3D system colours live in src/data/theme.ts.
        ink: '#0d1117',
        panel: '#161b22',
        edge: '#30363d',
        accent: '#d29922',
        muted: '#7d8590',
        text: '#e6edf3',
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
    },
  },
  plugins: [],
};
