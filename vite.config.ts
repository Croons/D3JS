import { defineConfig } from 'vite';

export default defineConfig({
  base: '/D3JS/',
  plugins: [],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['three']
  }
});