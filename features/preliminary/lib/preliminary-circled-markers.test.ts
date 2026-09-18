import { wrapCircledMarkers } from '@/features/preliminary/lib/preliminary-circled-markers';
import {
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { describe, expect, it } from 'vitest';

type MarkerElement = ReactElement<{
  children?: ReactNode;
  className?: string;
}>;

function expectMarker(node: ReactNode, marker: string) {
  expect(isValidElement(node)).toBe(true);
  const element = node as MarkerElement;
  expect(element.type).toBe('span');
  expect(element.props.children).toBe(marker);
  expect(element.props.className).toContain('font-sans');
  expect(element.props.className).toContain('text-[1.4em]');
}

describe('wrapCircledMarkers', () => {
  it('splits circled markers into enlarged sans-serif spans', () => {
    const nodes = wrapCircledMarkers('a①b②c') as ReactNode[];

    expect(nodes).toHaveLength(5);
    expect(nodes[0]).toBe('a');
    expectMarker(nodes[1], '①');
    expect(nodes[2]).toBe('b');
    expectMarker(nodes[3], '②');
    expect(nodes[4]).toBe('c');
  });

  it('covers the full circled digit range', () => {
    const nodes = wrapCircledMarkers('⓪…⑳') as ReactNode[];

    expect(nodes).toHaveLength(5);
    expectMarker(nodes[1], '⓪');
    expect(nodes[2]).toBe('…');
    expectMarker(nodes[3], '⑳');
  });

  it('ignores non-circled lookalikes and plain text', () => {
    expect(wrapCircledMarkers('㉑ (21)')).toBe('㉑ (21)');
    expect(wrapCircledMarkers('int a = 1;')).toBe('int a = 1;');
  });

  it('recurses into rendered code elements and preserves their props', () => {
    const line = createElement(
      'span',
      { className: 'code-line', key: 'line-1' },
      'x①y'
    );
    const wrapped = wrapCircledMarkers(line) as MarkerElement;

    expect(wrapped.props.className).toBe('code-line');
    expect(wrapped.key).toBe('line-1');
    const nodes = wrapped.props.children as ReactNode[];
    expect(nodes[0]).toBe('x');
    expectMarker(nodes[1], '①');
    expect(nodes[2]).toBe('y');
  });

  it('walks arrays and nested elements without touching clean content', () => {
    const tree = [
      'no markers here',
      createElement('code', { key: 'c' }, 'plain'),
    ];
    const wrapped = wrapCircledMarkers(tree) as ReactNode[];

    expect(wrapped).toHaveLength(2);
    expect(wrapped[0]).toBe('no markers here');
    expect(wrapped[1]).toBe(tree[1]);
  });

  it('passes through non-string primitives', () => {
    expect(wrapCircledMarkers(null)).toBeNull();
    expect(wrapCircledMarkers(undefined)).toBeUndefined();
    expect(wrapCircledMarkers(42)).toBe(42);
  });
});
