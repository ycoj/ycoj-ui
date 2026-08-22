import { preserveLatexLineBreaks } from '@/shared/components/markdown/latex-line-breaks';
import { describe, expect, it } from 'vitest';

describe('preserveLatexLineBreaks', () => {
  it('preserves standard line breaks in inline and display math', () => {
    expect(preserveLatexLineBreaks(String.raw`$a \\ b$`)).toBe(
      String.raw`$a \\\\ b$`
    );
    expect(preserveLatexLineBreaks(String.raw`$$a \\ b$$`)).toBe(
      String.raw`$$a \\\\ b$$`
    );
  });

  it('does not change prose, fenced code, or existing longer runs', () => {
    const source = [
      String.raw`text \\ text`,
      '',
      '```latex',
      String.raw`$a \\ b$`,
      '```',
      '',
      String.raw`$$a \\\\ b$$`,
    ].join('\n');

    expect(preserveLatexLineBreaks(source)).toBe(source);
  });

  it('leaves ordinary LaTeX commands unchanged', () => {
    expect(preserveLatexLineBreaks(String.raw`$\frac{a}{b}$`)).toBe(
      String.raw`$\frac{a}{b}$`
    );
  });
});
