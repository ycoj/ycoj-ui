import { spawn } from 'node:child_process';
import { existsSync, globSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

// pnpm does not run playwright's install hooks, so a fresh clone has no
// browser binaries. Fail fast instead of erroring inside the first batch.
const chromiumPath = chromium.executablePath();
if (!chromiumPath || !existsSync(chromiumPath)) {
  console.error(
    'Playwright Chromium is not installed.\n' +
      'Run `pnpm exec playwright install chromium` and try again.'
  );
  process.exit(1);
}

// A single vitest run over all files keeps leaking pages/memory in the
// browser, so files run in sequential batches. BROWSER_TEST_BATCH_SIZE
// overrides the default for local tuning.
const batchSize = Number(process.env.BROWSER_TEST_BATCH_SIZE ?? 40);
if (!Number.isInteger(batchSize) || batchSize < 1) {
  throw new Error('BROWSER_TEST_BATCH_SIZE must be a positive integer.');
}

// globSync also matches directories, and failed runs leave artifact dirs
// named after test files (__traces__, failure screenshots, attachments).
// The excludes only prune the walk; the isFile check is what keeps fake
// "test files" from being passed to vitest as filters.
const testFiles = globSync('**/*.browser.test.{ts,tsx}', {
  exclude: ['node_modules/**', '.next/**', '**/__traces__/**'],
  withFileTypes: true,
})
  .filter((entry) => entry.isFile())
  .map((entry) => join(entry.parentPath, entry.name))
  .sort();

const vitest = resolve('node_modules/vitest/vitest.mjs');

function runBatch(files) {
  return new Promise((resolveBatch, rejectBatch) => {
    const child = spawn(
      process.execPath,
      [vitest, 'run', '--config', 'vitest.browser.config.mts', ...files],
      { stdio: 'inherit' }
    );

    child.on('error', rejectBatch);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolveBatch();
        return;
      }
      rejectBatch(
        new Error(
          `Browser test batch exited with ${signal ? `signal ${signal}` : `code ${code}`}.`
        )
      );
    });
  });
}

for (let start = 0; start < testFiles.length; start += batchSize) {
  await runBatch(testFiles.slice(start, start + batchSize));
}
