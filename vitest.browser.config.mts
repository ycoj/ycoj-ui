import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'server-only': 'next/dist/compiled/server-only/empty.js',
    },
    tsconfigPaths: true,
  },
  test: {
    maxWorkers: 2,
    browser: {
      enabled: true,
      headless: true,
      instances: [{ browser: 'chromium' }],
      provider: playwright(),
      trace: 'retain-on-failure',
      screenshotDirectory: 'test-results/screenshots',
    },
    include: ['**/*.browser.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    setupFiles: ['./vitest.setup.ts', './vitest.browser.setup.ts'],
  },
});
