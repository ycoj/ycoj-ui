import remarkPdf from './remark-pdf';
import { describe, expect, it } from 'vitest';

type TestNode = {
  type: string;
  children?: TestNode[];
  data?: Record<string, unknown>;
  title?: string | null;
  url?: string;
  value?: string;
};

function makePdfTree(url: string, label = 'pdf'): TestNode {
  return {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          { type: 'text', value: '@' },
          {
            type: 'link',
            url,
            children: [{ type: 'text', value: label }],
          },
        ],
      },
    ],
  };
}

function transform(tree: TestNode) {
  remarkPdf()(tree);
  return tree;
}

describe('remarkPdf', () => {
  it.each([
    'https://example.com/document.pdf',
    'http://example.com/document.pdf',
    '//cdn.example.com/document.pdf',
    '/document.pdf',
    'documents/document.pdf',
  ])('converts a standalone PDF link for %s', (url) => {
    const tree = transform(makePdfTree(url));

    expect(tree.children?.[0]).toMatchObject({
      type: 'paragraph',
      children: [],
      data: {
        hName: 'pdf-embed',
        hProperties: { 'data-src': url },
      },
    });
  });

  it.each(['javascript:alert(1)', 'data:application/pdf;base64,AA=='])(
    'keeps an unsafe URL as ordinary Markdown for %s',
    (url) => {
      const tree = makePdfTree(url);

      expect(transform(tree)).toEqual(tree);
      expect(tree.children?.[0]?.data).toBeUndefined();
    }
  );

  it('requires an exact lowercase pdf label', () => {
    const tree = makePdfTree('/document.pdf', 'PDF');

    transform(tree);

    expect(tree.children?.[0]?.data).toBeUndefined();
  });

  it('does not convert syntax mixed with paragraph text', () => {
    const tree = makePdfTree('/document.pdf');
    tree.children?.[0]?.children?.unshift({ type: 'text', value: 'See ' });

    transform(tree);

    expect(tree.children?.[0]?.data).toBeUndefined();
  });

  it('does not convert a link with a Markdown title', () => {
    const tree = makePdfTree('/document.pdf');
    const link = tree.children?.[0]?.children?.[1];
    if (link) link.title = 'Document';

    transform(tree);

    expect(tree.children?.[0]?.data).toBeUndefined();
  });
});
