import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
});