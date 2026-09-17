import {
  addLineNumbers,
  parseCodeLanguage,
} from '@/shared/lib/code-line-numbers';
import type { Element, ElementContent } from 'hast';
import { describe, expect, it } from 'vitest';

function lineSpans(children: ElementContent[]): Element[] {
  return children.filter(
    (node): node is Element =>
      node.type === 'element' && node.tagName === 'span'
  );
}

function textOf(children: ElementContent[]): string {
  return children
    .map((node) =>
      node.type === 'text'
        ? node.value
        : node.type === 'element'
          ? textOf(node.children)
          : ''
    )
    .join('');
}

describe('parseCodeLanguage', () => {
  it('keeps plain languages numbered', () => {
    expect(parseCodeLanguage('cpp')).toEqual({
      language: 'cpp',
      lineNumbers: true,
    });
  });

  it('strips the no-line-numbers suffix', () => {
    expect(parseCodeLanguage('cpp|no-line-numbers')).toEqual({
      language: 'cpp',
      lineNumbers: false,
    });
    expect(parseCodeLanguage('|no-line-numbers')).toEqual({
      language: '',
      lineNumbers: false,
    });
  });
});

describe('addLineNumbers', () => {
  it('wraps each line and preserves the text', () => {
    const source = 'int a;\nint b;';
    const { children } = addLineNumbers([{ type: 'text', value: source }]);

    expect(lineSpans(children)).toHaveLength(2);
    expect(textOf(children)).toBe(source);
  });

  it('does not number a phantom line after a trailing newline', () => {
    const source = 'int a;\nint b;\n';
    const { children } = addLineNumbers([{ type: 'text', value: source }]);

    expect(lineSpans(children)).toHaveLength(2);
    expect(textOf(children)).toBe(source);
  });

  it('keeps interior blank lines numbered', () => {
    const source = 'a\n\nb\n';
    const { children } = addLineNumbers([{ type: 'text', value: source }]);

    expect(lineSpans(children)).toHaveLength(3);
    expect(textOf(children)).toBe(source);
  });

  it('splits elements that span line breaks into per-line clones', () => {
    const comment: Element = {
      type: 'element',
      tagName: 'span',
      properties: { className: ['pl-c'] },
      children: [{ type: 'text', value: '/* a\nb */' }],
    };
    const { children } = addLineNumbers([comment]);

    const lines = lineSpans(children);
    expect(lines).toHaveLength(2);
    expect(lines[0]!.children[0]).toMatchObject({
      type: 'element',
      properties: { className: ['pl-c'] },
    });
    expect(textOf(children)).toBe('/* a\nb */');
    expect(lines[0]!.children[0]).not.toBe(lines[1]!.children[0]);
  });

  it('preserves the original line separators in the emitted text', () => {
    const source = 'a\r\nb\rc\r\n';
    const { children } = addLineNumbers([{ type: 'text', value: source }]);

    expect(lineSpans(children)).toHaveLength(3);
    expect(textOf(children)).toBe(source);
  });

  it('renders no numbered line for an empty source', () => {
    expect(addLineNumbers([])).toEqual({ children: [], lineNumberDigits: 1 });
    expect(addLineNumbers([{ type: 'text', value: '' }]).children).toHaveLength(
      0
    );
  });

  it.each(['\n', '\r\n', '\r'] as const)(
    'preserves a source made of a single break %j',
    (source) => {
      const { children } = addLineNumbers([{ type: 'text', value: source }]);

      expect(lineSpans(children)).toHaveLength(0);
      expect(textOf(children)).toBe(source);
    }
  );

  it.each([
    [1, 1],
    [9, 1],
    [10, 2],
    [99, 2],
    [100, 3],
    [1000, 4],
  ] as const)(
    'sizes a %i-line block for %i-digit numbers',
    (lineCount, digits) => {
      const source = Array.from(
        { length: lineCount },
        (_, index) => `line ${index}`
      ).join('\n');
      const { lineNumberDigits } = addLineNumbers([
        { type: 'text', value: source },
      ]);

      expect(lineNumberDigits).toBe(digits);
    }
  );
});
