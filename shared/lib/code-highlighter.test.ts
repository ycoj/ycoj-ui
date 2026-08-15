import { highlightCodeToHtml } from '@/shared/lib/code-highlighter';
import { describe, expect, it } from 'vitest';

describe('highlightCodeToHtml', () => {
  it('highlights code and escapes markup in string literals', () => {
    const html = highlightCodeToHtml('const value = "<tag>";', 'cpp');

    expect(html).toContain('class="pl-k"');
    expect(html).toContain('&#x3C;tag>');
    expect(html).not.toContain('"<tag>"');
  });
});
