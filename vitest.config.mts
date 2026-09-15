import codspeedPlugin from '@codspeed/vitest-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  plugins: [react(), codspeedPlugin()],
  resolve: {
    alias: {
      'server-only': 'next/dist/compiled/server-only/empty.js',
    },
    tsconfigPaths: true,
  },
  test: {
    ...(mode !== 'benchmark' && {
      pool: 'vmThreads',
      maxWorkers: 2,
      vmMemoryLimit: '512MB',
    }),
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', '**/*.browser.{test,spec}.{ts,tsx}'],
    benchmark: {
      include: ['**/*.bench.{ts,tsx}'],
      exclude: ['node_modules', '.next'],
    },
  },
}));
