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

// A batch that hangs (e.g. a browser page that never finishes loading)
// must not stall the whole run; the largest healthy batch finishes in
// ~2 minutes, so 5 minutes leaves ample headroom. Hung pages are the
// vitest browser iframe handshake flake, which clears on a rerun, so a
// failed batch is retried in recursively smaller chunks before its
// files are reported as failed.
const batchTimeoutMs = Number(
  process.env.BROWSER_TEST_BATCH_TIMEOUT_MS ?? 5 * 60 * 1000
);
if (!Number.isInteger(batchTimeoutMs) || batchTimeoutMs < 1) {
  throw new Error('BROWSER_TEST_BATCH_TIMEOUT_MS must be a positive integer.');
}

function runBatchOnce(files) {
  return new Promise((resolveBatch, rejectBatch) => {
    const child = spawn(
      process.execPath,
      [vitest, 'run', '--config', 'vitest.browser.config.mts', ...files],
      { stdio: 'inherit' }
    );

    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      if (error) rejectBatch(error);
      else resolveBatch();
    };
    const watchdog = setTimeout(() => {
      child.kill('SIGKILL');
      finish(
        new Error(
          `Browser test batch timed out after ${batchTimeoutMs / 60000} minutes.`
        )
      );
    }, batchTimeoutMs);

    child.on('error', (error) => finish(error));
    child.on('exit', (code, signal) => {
      if (code === 0) {
        finish();
        return;
      }
      finish(
        new Error(
          `Browser test batch exited with ${signal ? `signal ${signal}` : `code ${code}`}.`
        )
      );
    });
  });
}

// Retry depth is limited so genuine failures end up reported per file
// without re-running the whole set each time.
const maxRetryDepth = 3;

async function runBatch(files, depth = 0) {
  try {
    await runBatchOnce(files);
    return;
  } catch (error) {
    if (depth >= maxRetryDepth || files.length === 1) {
      throw error;
    }
    console.error(
      `${error instanceof Error ? error.message : error}\nRetrying ${files.length} files in smaller batches...`
    );
    // A failing chunk must not stop its sibling chunks from running.
    const half = Math.ceil(files.length / 2);
    const errors = [];
    for (const chunk of [files.slice(0, half), files.slice(half)]) {
      try {
        await runBatch(chunk, depth + 1);
      } catch (chunkError) {
        errors.push(chunkError);
      }
    }
    if (errors.length > 0) throw errors[0];
  }
}

let failed = false;
for (let start = 0; start < testFiles.length; start += batchSize) {
  try {
    await runBatch(testFiles.slice(start, start + batchSize));
  } catch (error) {
    // Keep going so a failure in one batch does not hide results from the
    // remaining batches; the run still exits non-zero below.
    failed = true;
    console.error(error instanceof Error ? error.message : error);
  }
}
if (failed) process.exit(1);
