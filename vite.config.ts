import { defineConfig } from 'vite';

export default defineConfig({
  base: '/D3JS/',
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