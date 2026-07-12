import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite Configuration for TransitOps Frontend
 * Configures development server, build settings, and HMR for React
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
  },
  define: {
    __DEV__: JSON.stringify(true),
  },
});
