import {
  highlightCodeToHtml,
  isSupportedCodeLanguage,
} from '@/shared/lib/code-highlighter';
import { describe, expect, it } from 'vitest';

describe('isSupportedCodeLanguage', () => {
  it.each(['cpp', 'python', 'javascript'])('recognizes %s', (language) => {
    expect(isSupportedCodeLanguage(language)).toBe(true);
  });

  it.each(['', 'unknown-language', 'constructor'])('rejects %j', (language) => {
    expect(isSupportedCodeLanguage(language)).toBe(false);
  });
});

describe('highlightCodeToHtml', () => {
  it('highlights code and escapes markup in string literals', () => {
    const html = highlightCodeToHtml('const value = "<tag>";', 'cpp');

    expect(html).toContain('class="pl-k"');
    expect(html).toContain('&#x3C;tag>');
    expect(html).not.toContain('"<tag>"');
  });

  it('falls back to C++ highlighting for unknown languages', () => {
    const html = highlightCodeToHtml('int value = 1;', 'unknown-language');

    expect(html).toContain('class="pl-k"');
    expect(html).toContain('int');
  });

  it('escapes unknown languages as plaintext when requested', () => {
    const html = highlightCodeToHtml(
      '  <img src=x onerror=alert(1)>\n\n',
      'unknown-language',
      'plaintext'
    );

    expect(html).toContain('&#x3C;img src=x onerror=alert(1)>\n\n');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('class="pl-k"');
  });
});
