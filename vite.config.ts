import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this project from https://<user>.github.io/svp-atlas/
// so every emitted asset URL must be prefixed with the repository name.
export default defineConfig({
  base: '/svp-atlas/',
  plugins: [react()],
  server: {
    host: true, // reachable from the iPad on the same network
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
  },
});
