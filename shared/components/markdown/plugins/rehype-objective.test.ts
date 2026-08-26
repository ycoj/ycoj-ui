import rehypeObjective from './rehype-objective';
import type { Element, ElementContent, Root, RootContent, Text } from 'hast';
import { describe, expect, it } from 'vitest';

function t(value: string): Text {
  return { type: 'text', value };
}

function el(tagName: string, children: ElementContent[] = []): Element {
  return { type: 'element', tagName, properties: {}, children };
}

function li(textValue: string): Element {
  return el('li', [t(textValue)]);
}

function ul(items: string[]): Element {
  return el('ul', items.map(li));
}

function p(children: ElementContent[]): Element {
  return el('p', children);
}

function root(children: RootContent[]): Root {
  return { type: 'root', children };
}

function apply(tree: Root): Root {
  rehypeObjective()(tree);
  return tree;
}

describe('rehype-objective inline splitting', () => {
  it('splits {{ input(1) }} into objective-input', () => {
    const tree = root([t('Hello {{ input(1) }} world')]);
    apply(tree);
    expect(tree.children).toHaveLength(3);
    expect(tree.children[0]).toEqual(t('Hello '));
    const node = tree.children[1] as Element;
    expect(node.tagName).toBe('objective-input');
    expect(node.properties).toEqual({ 'data-id': '1' });
    expect(tree.children[2]).toEqual(t(' world'));
  });

  it('splits {{ textarea(2) }} into objective-textarea', () => {
    const tree = root([t('Q: {{ textarea(2) }} end')]);
    apply(tree);
    expect(tree.children).toHaveLength(3);
    expect((tree.children[1] as Element).tagName).toBe('objective-textarea');
    expect((tree.children[1] as Element).properties).toEqual({
      'data-id': '2',
    });
  });

  it('splits {{ dropdown(3)[a,b] }} into objective-dropdown with options', () => {
    const tree = root([t('Choose {{ dropdown(3)[a,b] }} ok')]);
    apply(tree);
    expect(tree.children).toHaveLength(3);
    const dd = tree.children[1] as Element;
    expect(dd.tagName).toBe('objective-dropdown');
    expect(dd.properties).toEqual({
      'data-id': '3',
      'data-options': JSON.stringify(['a', 'b']),
    });
    expect(dd.children).toHaveLength(2);
    expect((dd.children[0] as Element).tagName).toBe('objective-option');
    expect((dd.children[0] as Element).properties).toEqual({
      'data-value': 'a',
    });
    expect((dd.children[1] as Element).properties).toEqual({
      'data-value': 'b',
    });
  });

  it('trims and filters dropdown options', () => {
    const tree = root([t('{{ dropdown(1)[ a , , b ] }}')]);
    apply(tree);
    const dd = tree.children[0] as Element;
    expect(dd.properties['data-options']).toBe(JSON.stringify(['a', 'b']));
  });

  it('handles dropdown with range id and multiple occurrences', () => {
    const tree = root([t('{{ input(1-3) }} and {{ textarea(2) }}')]);
    apply(tree);
    expect(tree.children).toHaveLength(3);
    expect((tree.children[0] as Element).properties).toEqual({
      'data-id': '1-3',
    });
    expect((tree.children[2] as Element).tagName).toBe('objective-textarea');
  });

  it('splits multiple inline tokens in same text node', () => {
    const tree = root([t('a {{ input(1) }} b {{ input(2) }} c')]);
    apply(tree);
    expect(tree.children).toHaveLength(5);
    expect((tree.children[1] as Element).properties).toEqual({
      'data-id': '1',
    });
    expect((tree.children[3] as Element).properties).toEqual({
      'data-id': '2',
    });
  });

  it('handles text with no surrounding content', () => {
    const tree = root([t('{{ input(5) }}')]);
    apply(tree);
    expect(tree.children).toHaveLength(1);
    expect((tree.children[0] as Element).tagName).toBe('objective-input');
  });
});

describe('rehype-objective block select + ul conversion', () => {
  it('converts {{ select(1) }} + ul into objective-select (empty p case)', () => {
    const tree = root([p([t('{{ select(1) }}')]), ul(['opt1', 'opt2'])]);
    apply(tree);
    expect(tree.children).toHaveLength(1);
    const sel = tree.children[0] as Element;
    expect(sel.tagName).toBe('objective-select');
    expect(sel.properties).toEqual({ 'data-id': '1' });
    expect(sel.children).toHaveLength(2);
    expect((sel.children[0] as Element).properties).toEqual({
      'data-value': 'A',
    });
    expect((sel.children[1] as Element).properties).toEqual({
      'data-value': 'B',
    });
  });

  it('converts {{ multiselect(2) }} + ul into objective-multiselect', () => {
    const tree = root([p([t('{{ multiselect(2) }}')]), ul(['x', 'y', 'z'])]);
    apply(tree);
    const ms = tree.children[0] as Element;
    expect(ms.tagName).toBe('objective-multiselect');
    expect(ms.properties).toEqual({ 'data-id': '2' });
    expect(ms.children).toHaveLength(3);
  });

  it('keeps surrounding text when p is non-empty', () => {
    const tree = root([
      p([t('Question {{ select(1) }} more')]),
      ul(['a', 'b']),
    ]);
    apply(tree);
    expect(tree.children).toHaveLength(2);
    const para = tree.children[0] as Element;
    expect(para.tagName).toBe('p');
    // token removed, remaining text split into before/after nodes
    expect(para.children).toHaveLength(2);
    expect(para.children[0]).toEqual(t('Question '));
    expect(para.children[1]).toEqual(t(' more'));
    expect((tree.children[1] as Element).tagName).toBe('objective-select');
  });

  it('skips whitespace text nodes between token and ul', () => {
    const tree = root([p([t('{{ select(1) }}')]), t('  \n  '), ul(['a'])]);
    apply(tree);
    // whitespace text remains, ul replaced with select
    expect(tree.children).toHaveLength(2);
    expect((tree.children[0] as Text).value).toBe('  \n  ');
    expect((tree.children[1] as Element).tagName).toBe('objective-select');
  });

  it('does not convert when no following ul', () => {
    const tree = root([p([t('{{ select(1) }}')]), p([t('no list')])]);
    const before = JSON.stringify(tree);
    apply(tree);
    expect(JSON.stringify(tree)).toBe(before);
  });

  it('does not convert when non-ul element follows', () => {
    const tree = root([p([t('{{ select(1) }}')]), el('ol', [li('a')])]);
    apply(tree);
    // should remain as original p + ol (inline not triggered for select)
    expect(tree.children).toHaveLength(2);
    expect((tree.children[0] as Element).tagName).toBe('p');
    expect((tree.children[1] as Element).tagName).toBe('ol');
  });

  it('handles select with plain text root child', () => {
    const tree = root([t('{{ select(3) }}'), ul(['one', 'two'])]);
    apply(tree);
    expect(tree.children).toHaveLength(1);
    expect((tree.children[0] as Element).tagName).toBe('objective-select');
    expect((tree.children[0] as Element).properties).toEqual({
      'data-id': '3',
    });
  });
});

describe('rehype-objective passthrough and skipping', () => {
  it('leaves non-matching text unchanged', () => {
    const tree = root([t('hello world'), p([t('no tokens')])]);
    const snapshot = JSON.stringify(tree);
    apply(tree);
    expect(JSON.stringify(tree)).toBe(snapshot);
  });

  it('does not split inside code element', () => {
    const code = el('code', [t('{{ input(1) }}')]);
    const tree = root([code]);
    apply(tree);
    expect(tree.children[0]).toBe(code);
    expect((code.children[0] as Text).value).toBe('{{ input(1) }}');
  });

  it('does not split inside pre element', () => {
    const pre = el('pre', [t('{{ textarea(2) }}')]);
    const tree = root([pre]);
    apply(tree);
    expect((pre.children[0] as Text).value).toBe('{{ textarea(2) }}');
  });

  it('does not process code nested inside p', () => {
    const code = el('code', [t('{{ input(1) }}')]);
    const para = p([t('before '), code, t(' after')]);
    const tree = root([para]);
    apply(tree);
    // inline outside code should not be affected (no token outside), code content untouched
    expect((code.children[0] as Text).value).toBe('{{ input(1) }}');
    // ensure walk did not descend into code
    expect(para.children).toHaveLength(3);
  });

  it('processes inline tokens inside regular elements', () => {
    const para = p([t('a {{ input(1) }} b')]);
    const tree = root([para]);
    apply(tree);
    expect(para.children).toHaveLength(3);
    expect((para.children[1] as Element).tagName).toBe('objective-input');
  });
});
