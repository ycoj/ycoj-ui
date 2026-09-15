import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Server Components import `server-only`; browser tests only render their
    // client output, so reuse the same empty module as the jsdom config.
    alias: { 'server-only': 'next/dist/compiled/server-only/empty.js' },
    tsconfigPaths: true,
    // Prebundled deps must share the same React instance as
    // `vitest-browser-react`.
    dedupe: ['react', 'react-dom'],
  },
  // Discovered late by dayjs imports; prebundling them avoids a mid-run reload.
  // The scratchpad's clangd worker requires shared Wasm memory, which browsers
  // only expose in a cross-origin isolated document.
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    include: [
      'dayjs/plugin/customParseFormat',
      'dayjs/plugin/duration',
      '@monaco-editor/react',
      'ansi_up',
      'react-resizable-panels',
      'reconnecting-websocket',
      'alova/client',
      'mime-types',
    ],
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
