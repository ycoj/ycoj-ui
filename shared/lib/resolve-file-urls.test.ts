import { resolveFileUrls } from './resolve-file-urls';
import { describe, expect, it } from 'vitest';

describe('resolveFileUrls', () => {
  it('resolves Markdown links, images, PDF embeds, and raw HTML attributes', () => {
    const content = [
      '[download](file://asset.zip)',
      '![image](file://image.jpg)',
      '@[pdf](file://document.pdf)',
      '<img src="file://image.jpg">',
      "<a href='file://asset.zip'>raw link</a>",
    ].join('\n');

    expect(
      resolveFileUrls(content, {
        baseUrl: '/api/p/42/file',
        filenames: ['asset.zip', 'image.jpg', 'document.pdf'],
      })
    ).toBe(
      [
        '[download](/api/p/42/file/asset.zip)',
        '![image](/api/p/42/file/image.jpg)',
        '@[pdf](/api/p/42/file/document.pdf)',
        '<img src="/api/p/42/file/image.jpg">',
        "<a href='/api/p/42/file/asset.zip'>raw link</a>",
      ].join('\n')
    );
  });

  it('preserves URL encoding and existing query parameters', () => {
    expect(
      resolveFileUrls(
        '![图](file://%E4%B8%AD%E6%96%87%20%E5%9B%BE.png?noDisposition=1)',
        {
          baseUrl: '/api/p/7/file',
          filenames: ['中文 图.png'],
          query: { tid: 'contest id' },
        }
      )
    ).toBe(
      '![图](/api/p/7/file/%E4%B8%AD%E6%96%87%20%E5%9B%BE.png?noDisposition=1&tid=contest+id)'
    );
  });

  it('adds query parameters before a URL fragment', () => {
    expect(
      resolveFileUrls('@[pdf](file://document.pdf#page=2)', {
        baseUrl: '/api/p/7/file',
        filenames: ['document.pdf'],
        query: { tid: 'abc' },
      })
    ).toBe('@[pdf](/api/p/7/file/document.pdf?tid=abc#page=2)');
  });

  it('leaves unknown and malformed filenames unchanged', () => {
    const content = [
      '![missing](file://missing.jpg)',
      '![malformed](file://bad%ZZ.jpg)',
    ].join('\n');

    expect(
      resolveFileUrls(content, {
        baseUrl: '/api/p/42/file',
        filenames: ['image.jpg'],
      })
    ).toBe(content);
  });
});
