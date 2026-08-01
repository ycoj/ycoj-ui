import { resolveFileUrls } from './resolve-file-urls';
import { bench, describe } from 'vitest';

const filenames = [
  'asset.zip',
  'image.jpg',
  'document.pdf',
  'sample data.txt',
] as const;

const snippet = [
  '[download](file://asset.zip)',
  '![image](file://image.jpg)',
  '@[pdf](file://document.pdf)',
  '<img src="file://image.jpg">',
  "<a href='file://sample%20data.txt'>raw link</a>",
].join('\n');

function makeStatement(sections: number) {
  const parts: string[] = [];
  for (let index = 0; index < sections; index += 1) {
    parts.push(`## Section ${index}`);
    parts.push(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod ' +
        'tempor incididunt ut labore et dolore magna aliqua.'
    );
    parts.push(snippet);
    parts.push('```cpp\nint main() { return 0; }\n```');
  }
  return parts.join('\n\n');
}

const shortStatement = makeStatement(1);
const longStatement = makeStatement(120);
const noFileUrls = longStatement.replaceAll('file://', 'https://cdn.invalid/');

// Keeps results reachable so the engine cannot drop the calls entirely.
const sink: { value: unknown } = { value: undefined };

describe('resolveFileUrls', () => {
  bench('short problem statement', () => {
    sink.value = resolveFileUrls(shortStatement, {
      baseUrl: '/api/p/42/file',
      filenames,
    });
  });

  bench('long problem statement', () => {
    sink.value = resolveFileUrls(longStatement, {
      baseUrl: '/api/p/42/file',
      filenames,
    });
  });

  bench('long problem statement with query parameters', () => {
    sink.value = resolveFileUrls(longStatement, {
      baseUrl: '/api/p/42/file',
      filenames,
      query: { secret: 'token-value', type: 'additional_file' },
    });
  });

  bench('long statement without file urls', () => {
    sink.value = resolveFileUrls(noFileUrls, {
      baseUrl: '/api/p/42/file',
      filenames,
    });
  });
});
