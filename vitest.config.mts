import codspeedPlugin from '@codspeed/vitest-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), codspeedPlugin()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    benchmark: {
      include: ['**/*.bench.{ts,tsx}'],
      exclude: ['node_modules', '.next'],
    },
  },
});
