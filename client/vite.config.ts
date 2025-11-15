import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'socket-vendor': ['socket.io-client'],
          'player-vendor': ['react-player'],
          'motion-vendor': ['framer-motion'],
          'emoji-vendor': ['@emoji-mart/react', '@emoji-mart/data'],
          'window-vendor': ['react-window'],
        },
      },
    },
    // Tree shaking için
    minify: 'esbuild', // terser yerine esbuild kullan (daha hızlı ve varsayılan)
    // Chunk size uyarıları
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'socket.io-client', 'react-player', 'framer-motion', 'react-window'],
  },
});

