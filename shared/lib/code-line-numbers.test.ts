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
    const out = addLineNumbers([{ type: 'text', value: source }]);

    expect(lineSpans(out)).toHaveLength(2);
    expect(textOf(out)).toBe(source);
  });

  it('does not number a phantom line after a trailing newline', () => {
    const source = 'int a;\nint b;\n';
    const out = addLineNumbers([{ type: 'text', value: source }]);

    expect(lineSpans(out)).toHaveLength(2);
    expect(textOf(out)).toBe(source);
  });

  it('keeps interior blank lines numbered', () => {
    const source = 'a\n\nb\n';
    const out = addLineNumbers([{ type: 'text', value: source }]);

    expect(lineSpans(out)).toHaveLength(3);
    expect(textOf(out)).toBe(source);
  });

  it('splits elements that span line breaks into per-line clones', () => {
    const comment: Element = {
      type: 'element',
      tagName: 'span',
      properties: { className: ['pl-c'] },
      children: [{ type: 'text', value: '/* a\nb */' }],
    };
    const out = addLineNumbers([comment]);

    const lines = lineSpans(out);
    expect(lines).toHaveLength(2);
    expect(lines[0]!.children[0]).toMatchObject({
      type: 'element',
      properties: { className: ['pl-c'] },
    });
    expect(textOf(out)).toBe('/* a\nb */');
    // The original element is split into two clones.
    expect(lines[0]!.children[0]).not.toBe(lines[1]!.children[0]);
  });

  it('handles CRLF line endings', () => {
    const source = 'a\r\nb';
    const out = addLineNumbers([{ type: 'text', value: source }]);

    expect(lineSpans(out)).toHaveLength(2);
  });
});
