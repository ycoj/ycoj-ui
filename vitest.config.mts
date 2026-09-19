import { sharedPlugins, sharedResolve } from './vitest.shared.mjs';
import codspeedPlugin from '@codspeed/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  plugins: [...sharedPlugins, codspeedPlugin()],
  resolve: sharedResolve,
  test: {
    ...(mode !== 'benchmark' && {
      pool: 'vmThreads',
      maxWorkers: 4,
      vmMemoryLimit: '512MB',
    }),
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', '**/*.browser.test.{ts,tsx}'],
    benchmark: {
      include: ['**/*.bench.{ts,tsx}'],
      exclude: ['node_modules', '.next'],
    },
  },
}));
