import remarkPdf from './remark-pdf';
import remarkProblemSamples from './remark-problem-samples';
import { bench, describe } from 'vitest';

type MdastNode = {
  type: string;
  children?: MdastNode[];
  data?: Record<string, unknown>;
  depth?: number;
  lang?: string;
  title?: string | null;
  url?: string;
  value?: string;
};

function paragraph(value: string): MdastNode {
  return { type: 'paragraph', children: [{ type: 'text', value }] };
}

function pdfParagraph(url: string): MdastNode {
  return {
    type: 'paragraph',
    children: [
      { type: 'text', value: '@' },
      {
        type: 'link',
        url,
        title: null,
        children: [{ type: 'text', value: 'pdf' }],
      },
    ],
  };
}

function code(lang: string, value: string): MdastNode {
  return { type: 'code', lang, value, children: [] };
}

// Rough shape of a parsed problem statement: prose, sample blocks and a PDF
// embed, all of which the remark plugins walk through on every render.
function buildStatementTree(sections: number): MdastNode {
  const children: MdastNode[] = [];

  for (let index = 0; index < sections; index += 1) {
    children.push({
      type: 'heading',
      depth: 2,
      children: [{ type: 'text', value: `Section ${index}` }],
    });
    children.push(
      paragraph(
        'Given an array of n integers, output the sum of every contiguous ' +
          'subarray with an even number of elements.'
      )
    );
    children.push(code(`input${index}`, '3\n1 2 3'));
    children.push(code(`output${index}`, '6'));
    children.push(pdfParagraph(`https://cdn.invalid/statement-${index}.pdf`));
    children.push({
      type: 'blockquote',
      children: [paragraph('Note: values fit in a 32-bit integer.')],
    });
  }

  return { type: 'root', children };
}

const SECTIONS = 40;

// Keeps results reachable so the engine cannot drop the calls entirely.
const sink: { value: unknown } = { value: undefined };

// The plugins mutate the tree they receive, so every iteration works on a
// freshly built tree. The `tree construction only` benchmark below is the
// baseline for that construction cost.
describe('markdown remark plugins', () => {
  bench('tree construction only (baseline)', () => {
    sink.value = buildStatementTree(SECTIONS);
  });

  bench('remarkPdf - problem statement tree', () => {
    const tree = buildStatementTree(SECTIONS);
    remarkPdf()(tree);
    sink.value = tree;
  });

  bench('remarkProblemSamples - problem statement tree', () => {
    const tree = buildStatementTree(SECTIONS);
    remarkProblemSamples()(tree);
    sink.value = tree;
  });

  bench('remarkPdf + remarkProblemSamples - problem statement tree', () => {
    const tree = buildStatementTree(SECTIONS);
    remarkProblemSamples()(tree);
    remarkPdf()(tree);
    sink.value = tree;
  });
});
