import remarkContainers from './remark-containers';
import type { Processor } from 'unified';
import { describe, expect, it, vi } from 'vitest';

type MdastNode = {
  type: string;
  children?: MdastNode[];
  data?: Record<string, unknown>;
  value?: string;
};

function paragraph(value: string): MdastNode {
  return { type: 'paragraph', children: [{ type: 'text', value }] };
}

function applyPlugin(
  tree: MdastNode,
  parse: Processor['parse'] = () => ({ type: 'root', children: [] }) as never
) {
  const transformer = remarkContainers.call({ parse } as unknown as Processor);
  transformer(tree, { toString: () => '' });
  return tree;
}

function applyWithStubParse(tree: MdastNode, parsed: MdastNode[]) {
  const parse = vi.fn(
    () =>
      ({ type: 'root', children: parsed }) as unknown as ReturnType<
        Processor['parse']
      >
  );
  applyPlugin(tree, parse as unknown as Processor['parse']);
  return parse;
}

describe('remarkContainers', () => {
  it('wraps an alert container written across paragraphs', () => {
    const tree = applyPlugin({
      type: 'root',
      children: [
        paragraph(':::info[Heads up]'),
        paragraph('Some content'),
        paragraph(':::'),
      ],
    });

    expect(tree.children).toHaveLength(1);
    const container = tree.children![0]!;
    expect(container.type).toBe('container');
    expect(container.data).toEqual({
      hName: 'md-alert',
      hProperties: { 'data-variant': 'info', 'data-title': 'Heads up' },
    });
    expect(container.children).toEqual([paragraph('Some content')]);
  });

  it('omits the title attribute when no title is given', () => {
    const tree = applyPlugin({
      type: 'root',
      children: [paragraph(':::error'), paragraph('Broken'), paragraph(':::')],
    });

    expect(tree.children![0]!.data).toEqual({
      hName: 'md-alert',
      hProperties: { 'data-variant': 'error' },
    });
  });

  it('keeps brackets inside a title', () => {
    const tree = applyPlugin({
      type: 'root',
      children: [paragraph(':::info[a] b]'), paragraph('x'), paragraph(':::')],
    });

    expect(tree.children![0]!.data?.hProperties).toEqual({
      'data-variant': 'info',
      'data-title': 'a] b',
    });
  });

  it('matches directives case-insensitively', () => {
    const tree = applyPlugin({
      type: 'root',
      children: [
        paragraph(':::SUCCESS[Done]'),
        paragraph('x'),
        paragraph(':::'),
      ],
    });

    expect(tree.children![0]!.data?.hProperties).toEqual({
      'data-variant': 'success',
      'data-title': 'Done',
    });
  });

  it('wraps an align container with the requested alignment', () => {
    const tree = applyPlugin({
      type: 'root',
      children: [
        paragraph(':::align{right}'),
        paragraph('x'),
        paragraph(':::'),
      ],
    });

    expect(tree.children![0]!.data).toEqual({
      hName: 'md-align',
      hProperties: { 'data-align': 'right' },
    });
  });

  it('re-parses the body of a compact container', () => {
    const tree = {
      type: 'root',
      children: [paragraph(':::warning\nBe **careful**\n:::')],
    };
    const stub = [paragraph('parsed body')];
    const parse = applyWithStubParse(tree, stub);

    expect(parse).toHaveBeenCalledWith('Be **careful**');
    expect(tree.children).toHaveLength(1);
    const container = tree.children[0]!;
    expect(container.data?.hName).toBe('md-alert');
    expect(container.data?.hProperties).toEqual({ 'data-variant': 'warning' });
    expect(container.children).toEqual(stub);
  });

  it('supports an opening line followed by sibling paragraphs before the closing marker', () => {
    const tree = {
      type: 'root',
      children: [
        paragraph(':::error\nFirst part'),
        paragraph('Second part'),
        paragraph(':::'),
      ],
    };
    const parse = applyWithStubParse(tree, [paragraph('parsed first part')]);

    expect(parse).toHaveBeenCalledWith('First part');
    expect(tree.children).toHaveLength(1);
    const container = tree.children[0]!;
    expect(container.data?.hProperties).toEqual({ 'data-variant': 'error' });
    expect(container.children).toEqual([
      paragraph('parsed first part'),
      paragraph('Second part'),
    ]);
  });

  it('requires the closing marker to be the last line of a compact container', () => {
    const source = ':::info\ncontent\n:::\ntrailing';
    const tree = applyPlugin({
      type: 'root',
      children: [paragraph(source)],
    });

    expect(tree.children).toEqual([paragraph(source)]);
  });

  it('leaves an unterminated container untouched', () => {
    const tree = applyPlugin({
      type: 'root',
      children: [paragraph(':::info'), paragraph('never closed')],
    });

    expect(tree.children).toEqual([
      paragraph(':::info'),
      paragraph('never closed'),
    ]);
  });

  it('leaves an unterminated compact container untouched', () => {
    const tree = applyPlugin({
      type: 'root',
      children: [paragraph(':::info\nnever closed')],
    });

    expect(tree.children).toEqual([paragraph(':::info\nnever closed')]);
  });

  it('ignores unknown container names', () => {
    const tree = applyPlugin({
      type: 'root',
      children: [paragraph(':::note'), paragraph('x'), paragraph(':::')],
    });

    expect(tree.children).toHaveLength(3);
    expect(tree.children!.every((child) => child.type === 'paragraph')).toBe(
      true
    );
  });

  it('ignores an align value outside the allowed set', () => {
    const tree = applyPlugin({
      type: 'root',
      children: [
        paragraph(':::align{middle}'),
        paragraph('x'),
        paragraph(':::'),
      ],
    });

    expect(tree.children).toHaveLength(3);
  });

  it('does not accept a title on align containers', () => {
    const tree = applyPlugin({
      type: 'root',
      children: [
        paragraph(':::align{center}[x]'),
        paragraph('x'),
        paragraph(':::'),
      ],
    });

    expect(tree.children).toHaveLength(3);
  });

  it('accepts a padded closing marker', () => {
    const tree = applyPlugin({
      type: 'root',
      children: [paragraph(':::info'), paragraph('x'), paragraph('  :::  ')],
    });

    expect(tree.children).toHaveLength(1);
    expect(tree.children![0]!.data?.hName).toBe('md-alert');
  });

  it('nests containers written across paragraphs', () => {
    const tree = applyPlugin({
      type: 'root',
      children: [
        paragraph(':::info'),
        paragraph(':::warning[Inner]'),
        paragraph('inner content'),
        paragraph(':::'),
        paragraph('outer content'),
        paragraph(':::'),
      ],
    });

    expect(tree.children).toHaveLength(1);
    const outer = tree.children![0]!;
    expect(outer.data?.hProperties).toEqual({ 'data-variant': 'info' });
    expect(outer.children).toHaveLength(2);

    const inner = outer.children![0]!;
    expect(inner.type).toBe('container');
    expect(inner.data?.hProperties).toEqual({
      'data-variant': 'warning',
      'data-title': 'Inner',
    });
    expect(inner.children).toEqual([paragraph('inner content')]);
    expect(outer.children![1]).toEqual(paragraph('outer content'));
  });

  it('matches the closing marker of a compact container by nesting depth', () => {
    const tree = {
      type: 'root',
      children: [paragraph(':::info\n:::warning\ninner\n:::\n:::')],
    };
    const parse = applyWithStubParse(tree, [paragraph('nested body')]);

    expect(parse).toHaveBeenCalledWith(':::warning\ninner\n:::');
    expect(tree.children).toHaveLength(1);
    const container = tree.children[0]!;
    expect(container.data?.hProperties).toEqual({ 'data-variant': 'info' });
    expect(container.children).toEqual([paragraph('nested body')]);
  });

  it('nests a compact container inside an expanded one', () => {
    const tree = {
      type: 'root',
      children: [
        paragraph(':::info'),
        paragraph(':::warning\ninner\n:::'),
        paragraph(':::'),
      ],
    };
    const parse = applyWithStubParse(tree, [paragraph('nested body')]);

    expect(parse).toHaveBeenCalledWith('inner');
    expect(tree.children).toHaveLength(1);
    const outer = tree.children[0]!;
    expect(outer.children).toHaveLength(1);
    const inner = outer.children![0]!;
    expect(inner.type).toBe('container');
    expect(inner.data?.hProperties).toEqual({ 'data-variant': 'warning' });
  });

  it('keeps completed inner containers when the outer one is unterminated', () => {
    const tree = applyPlugin({
      type: 'root',
      children: [
        paragraph(':::info'),
        paragraph(':::warning'),
        paragraph('inner'),
        paragraph(':::'),
      ],
    });

    expect(tree.children).toHaveLength(2);
    expect(tree.children![0]).toEqual(paragraph(':::info'));
    const inner = tree.children![1]!;
    expect(inner.type).toBe('container');
    expect(inner.data?.hProperties).toEqual({ 'data-variant': 'warning' });
    expect(inner.children).toEqual([paragraph('inner')]);
  });

  it('renders later siblings as containers when only the first is unterminated', () => {
    const tree = applyPlugin({
      type: 'root',
      children: [
        paragraph(':::info'),
        paragraph('dangling'),
        paragraph(':::success'),
        paragraph('fine'),
        paragraph(':::'),
      ],
    });

    expect(tree.children).toHaveLength(3);
    expect(tree.children![0]).toEqual(paragraph(':::info'));
    expect(tree.children![1]).toEqual(paragraph('dangling'));
    expect(tree.children![2]!.data?.hProperties).toEqual({
      'data-variant': 'success',
    });
  });

  it('keeps a stray closing marker as literal text', () => {
    const tree = applyPlugin({
      type: 'root',
      children: [paragraph(':::'), paragraph('x')],
    });

    expect(tree.children).toEqual([paragraph(':::'), paragraph('x')]);
  });
});
