import { sharedPlugins, sharedResolve } from './vitest.shared.mjs';
import { playwright } from '@vitest/browser-playwright';
import { availableParallelism } from 'node:os';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: sharedPlugins,
  resolve: sharedResolve,
  test: {
    // Each worker drives a separate browser page; Chromium contexts are heavy,
    // so cap the count instead of using every available core.
    maxWorkers: Math.min(8, availableParallelism()),
    browser: {
      enabled: true,
      headless: true,
      instances: [{ browser: 'chromium' }],
      provider: playwright(),
      // 'retain-on-failure' records a Playwright trace for every test and
      // roughly doubles the run; only enable it when debugging a failure.
      trace: 'off',
      screenshotDirectory: 'test-results/screenshots',
    },
    include: ['**/*.browser.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    setupFiles: ['./vitest.setup.ts', './vitest.browser.setup.ts'],
  },
});
