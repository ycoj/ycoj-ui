import '@/app/globals.css';
import { afterEach } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { page } from 'vitest/browser';

// Next.js client components read `process.env` at module scope (for example
// `next/image` reads `process.env.__NEXT_IMAGE_OPTS`). The browser has no
// `process`, so provide a runtime object that `vi.stubEnv` can also mutate.
const processLike = globalThis as unknown as {
  process?: { env: Record<string, string | undefined> };
};
processLike.process ??= { env: {} };
processLike.process.env['NODE_ENV'] ??= 'test';

afterEach(async () => {
  await cleanup();
  document.documentElement.classList.remove('dark');
  await page.viewport(1280, 720);
});
