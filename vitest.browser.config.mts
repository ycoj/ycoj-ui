import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Next.js client components read `process.env` at module scope (for example
  // `next/image` reads `process.env.__NEXT_IMAGE_OPTS`). Vite does not define
  // `process` in the browser, so provide the shape those modules expect.
  define: {
    'process.env': JSON.stringify({ NODE_ENV: 'test' }),
  },
  resolve: {
    tsconfigPaths: true,
    // Prebundled deps must share the same React instance as
    // `vitest-browser-react`.
    dedupe: ['react', 'react-dom'],
  },
  test: {
    include: ['**/*.browser.{test,spec}.{ts,tsx}'],
    setupFiles: ['./tests/browser/setup.ts'],
    restoreMocks: true,
    maxWorkers: 2,
    attachmentsDir: './test-results/attachments',
    browser: {
      enabled: true,
      provider: playwright({
        contextOptions: {
          locale: 'en-US',
          timezoneId: 'UTC',
          colorScheme: 'light',
          reducedMotion: 'reduce',
          deviceScaleFactor: 1,
        },
      }),
      headless: true,
      instances: [{ browser: 'chromium' }],
      viewport: { width: 1280, height: 720 },
      screenshotDirectory: './test-results/browser',
    },
  },
});
