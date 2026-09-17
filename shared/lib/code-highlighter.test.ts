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

  it('ignores the no-line-numbers flag', () => {
    expect(isSupportedCodeLanguage('cpp|no-line-numbers')).toBe(true);
  });
});

describe('highlightCodeToHtml', () => {
  it('highlights code and escapes markup in string literals', () => {
    const { html } = highlightCodeToHtml('const value = "<tag>";', 'cpp');

    expect(html).toContain('class="pl-k"');
    expect(html).toContain('&#x3C;tag>');
    expect(html).not.toContain('"<tag>"');
  });

  it('falls back to C++ highlighting for unknown languages', () => {
    const { html } = highlightCodeToHtml('int value = 1;', 'unknown-language');

    expect(html).toContain('class="pl-k"');
    expect(html).toContain('int');
  });

  it('escapes unknown languages as plaintext when requested', () => {
    const { html } = highlightCodeToHtml(
      '  <img src=x onerror=alert(1)>\n\n',
      'unknown-language',
      'plaintext'
    );

    expect(html.replace(/<[^>]*>/g, '')).toBe(
      '  &#x3C;img src=x onerror=alert(1)>\n\n'
    );
    expect(html).not.toContain('<img');
    expect(html).not.toContain('class="pl-k"');
  });

  it('wraps each line in a code-line span without changing the text', () => {
    const { html } = highlightCodeToHtml('int a;\nint b;\n', 'cpp');

    expect(html.match(/class="code-line"/g)).toHaveLength(2);
    // Stripping tags leaves the source text (with entities) untouched.
    expect(html.replace(/<[^>]*>/g, '')).toBe('int a;\nint b;\n');
  });

  it('numbers plaintext fallbacks too', () => {
    const { html } = highlightCodeToHtml(
      'a\nb',
      'unknown-language',
      'plaintext'
    );

    expect(html.match(/class="code-line"/g)).toHaveLength(2);
  });

  it('suppresses line numbers for the no-line-numbers language flag', () => {
    const { html } = highlightCodeToHtml(
      'int a;\nint b;\n',
      'cpp|no-line-numbers'
    );

    expect(html).not.toContain('code-line');
    expect(html).toContain('class="pl-k"');
    expect(html.replace(/<[^>]*>/g, '')).toBe('int a;\nint b;\n');
  });

  it('reports the gutter width needed for the largest line number', () => {
    const code = Array.from(
      { length: 10 },
      (_, index) => `int v${index};`
    ).join('\n');
    const { lineNumberDigits } = highlightCodeToHtml(code, 'cpp');

    expect(lineNumberDigits).toBe(2);
  });

  it('reports no gutter width when numbers are disabled', () => {
    const { lineNumberDigits } = highlightCodeToHtml(
      'int a;',
      'cpp|no-line-numbers'
    );

    expect(lineNumberDigits).toBeUndefined();
  });
});
