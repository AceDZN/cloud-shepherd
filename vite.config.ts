import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: '0.0.0.0', port: 5241, strictPort: true },
  preview: { host: '0.0.0.0', port: 4241, strictPort: true },
  build: { chunkSizeWarningLimit: 3000 },
});
