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

  it('preserves line breaks between escaped display math delimiters', () => {
    const source = String.raw`\$$a \\ b\$$`;

    expect(preserveLatexLineBreaks(source)).toBe(source);
  });

  it('processes math after an escaped backtick', () => {
    const source = String.raw`\`$a \\ b$\``;

    expect(preserveLatexLineBreaks(source)).toBe(String.raw`\`$a \\\\ b$\``);
  });

  it('does not change prose, fenced code, or code spans', () => {
    const source = [
      String.raw`text \\ text`,
      '',
      '```latex',
      String.raw`$a \\ b$`,
      '```',
      '',
      '`$a \\ b$`',
    ].join('\n');

    expect(preserveLatexLineBreaks(source)).toBe(source);
  });

  it('does not change inline or indented code', () => {
    const inlineCode = [
      '`',
      String.raw`$a \\ b$`,
      '` and ``',
      String.raw`$c \\ d$`,
      '``',
    ].join('');
    const source = [inlineCode, '', `    ${String.raw`$e \\ f$`}`].join('\n');

    expect(preserveLatexLineBreaks(source)).toBe(source);
  });

  it('requires a matching fence marker', () => {
    const source = ['```text', '~~~', String.raw`$a \\ b$`, '```'].join('\n');

    expect(preserveLatexLineBreaks(source)).toBe(source);
  });

  it('allows backtick runs inside a longer backtick fence', () => {
    const source = [
      '````markdown',
      '```latex',
      String.raw`$a \\ b$`,
      '```',
      '````',
    ].join('\n');

    expect(preserveLatexLineBreaks(source)).toBe(source);
  });

  it('doubles every backslash run inside math', () => {
    expect(preserveLatexLineBreaks(String.raw`$$a \\\\ b$$`)).toBe(
      String.raw`$$a \\\\\\\\ b$$`
    );
    expect(preserveLatexLineBreaks(String.raw`$a\\\%b$`)).toBe(
      String.raw`$a\\\\\\%b$`
    );
  });

  it('doubles a lone backslash at the end of a math line', () => {
    expect(preserveLatexLineBreaks('$$\na\\\nb\n$$')).toBe('$$\na\\\\\nb\n$$');
  });

  it('doubles backslashes of ordinary LaTeX commands', () => {
    expect(preserveLatexLineBreaks(String.raw`$\frac{a}{b}$`)).toBe(
      String.raw`$\\frac{a}{b}$`
    );
  });

  it('escapes markdown-active characters inside math', () => {
    expect(preserveLatexLineBreaks(String.raw`$a*b$`)).toBe(String.raw`$a\*b$`);
    expect(preserveLatexLineBreaks(String.raw`$a~b~c$`)).toBe(
      String.raw`$a\~b\~c$`
    );
    expect(preserveLatexLineBreaks(String.raw`$x_i$`)).toBe(String.raw`$x\_i$`);
    expect(preserveLatexLineBreaks(String.raw`$a<b>c$`)).toBe(
      String.raw`$a\<b>c$`
    );
  });

  it('escapes already-escaped markdown-active characters consistently', () => {
    expect(preserveLatexLineBreaks(String.raw`$a\*b$`)).toBe(
      String.raw`$a\\\*b$`
    );
    expect(preserveLatexLineBreaks(String.raw`$x\_i$`)).toBe(
      String.raw`$x\\\_i$`
    );
    expect(preserveLatexLineBreaks(String.raw`$a\<b$`)).toBe(
      String.raw`$a\\\<b$`
    );
  });

  it('does not escape markdown-active characters outside math', () => {
    const source = String.raw`*em* x_i a<b> ~~del~~ \\ text`;

    expect(preserveLatexLineBreaks(source)).toBe(source);
  });
});
