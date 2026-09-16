import { execFileSync, spawn } from 'node:child_process';
import { statSync } from 'node:fs';
import { resolve } from 'node:path';

const defaultBatchSize = process.env.CI ? 50 : 40;
const batchSize = Number(
  process.env.BROWSER_TEST_BATCH_SIZE ?? defaultBatchSize
);
if (!Number.isInteger(batchSize) || batchSize < 1) {
  throw new Error('BROWSER_TEST_BATCH_SIZE must be a positive integer.');
}
const testFiles = execFileSync(
  'rg',
  ['--files', '-g', '*.browser.test.ts', '-g', '*.browser.test.tsx'],
  { encoding: 'utf8' }
)
  .trim()
  .split('\n')
  .filter((file) => file && statSync(resolve(file)).isFile())
  .sort();

const vitest = resolve('node_modules/vitest/vitest.mjs');

function runBatch(files) {
  return new Promise((resolveBatch, rejectBatch) => {
    const child = spawn(
      process.execPath,
      [
        vitest,
        'run',
        '--passWithNoTests',
        '--config',
        'vitest.browser.config.mts',
        ...files,
      ],
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
