import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function legacyArucoGlobals() {
  return {
    name: 'legacy-aruco-globals',
    transform(code, id) {
      if (id.endsWith('/js-aruco2/src/cv.js')) return code.replace('this.CV = CV;', 'globalThis.CV = CV;');
      if (id.endsWith('/js-aruco2/src/aruco.js')) return code.replace('var CV = this.CV || require(\'./cv\').CV;', 'var CV = globalThis.CV || require(\'./cv\').CV;').replace('this.AR = AR;', 'globalThis.AR = AR;');
      return null;
    },
  };
}

export default defineConfig({
  plugins: [legacyArucoGlobals(), react()],
  // This repository is the nvnghia86.github.io user site and is served at root.
  // Keep the value overridable for a project site or a custom host.
  base: process.env.VITE_BASE_PATH || '/',
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          'ui-antd': ['antd', '@ant-design/icons'],
          'data-layer': ['@tanstack/react-query', 'zod', 'react-hook-form', '@hookform/resolvers'],
          'charts': ['recharts'],
          'motion-icons': ['framer-motion', 'lucide-react', 'sonner', 'qrcode.react'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
