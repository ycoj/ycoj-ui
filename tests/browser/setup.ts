import '@/app/globals.css';
import { afterEach } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { page } from 'vitest/browser';

afterEach(async () => {
  await cleanup();
  document.documentElement.classList.remove('dark');
  await page.viewport(1280, 720);
});
