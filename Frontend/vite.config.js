import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El proxy evita problemas de CORS en desarrollo:
// las llamadas a /api se redirigen al backend Express (puerto 4000).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
