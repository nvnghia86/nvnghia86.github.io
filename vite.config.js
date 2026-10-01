import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // This repository is published as a GitHub Pages project site.
  // Keep the value overridable for a user/organization site or a custom host.
  base: process.env.VITE_BASE_PATH || '/quiz-frontend/',
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
