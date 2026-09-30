import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages may host the app below /<repository-name>/.
  // Set VITE_BASE_PATH in the Pages workflow when the repository is not a user site.
  base: process.env.VITE_BASE_PATH || './',
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
