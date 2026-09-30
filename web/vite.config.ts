import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Saat pengembangan, /api.php diteruskan ke server PHP lokal (php -S 127.0.0.1:8081 -t ../server).
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    proxy: {
      '/api.php': 'http://127.0.0.1:8081',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
