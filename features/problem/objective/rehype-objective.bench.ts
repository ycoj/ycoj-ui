import rehypeObjective from './rehype-objective';
import type { Element, ElementContent, Root } from 'hast';
import { bench, describe } from 'vitest';

function text(value: string): ElementContent {
  return { type: 'text', value };
}

function element(tagName: string, children: ElementContent[] = []): Element {
  return { type: 'element', tagName, properties: {}, children };
}

function paragraph(value: string): Element {
  return element('p', [text(value)]);
}

function choiceList(questionIndex: number): Element {
  return element(
    'ul',
    Array.from({ length: 4 }, (_, optionIndex) =>
      element('li', [
        text(`Choice ${optionIndex + 1} for question ${questionIndex}`),
      ])
    )
  );
}

function buildObjectiveStatement(sectionCount: number): Root {
  const children: Root['children'] = [];

  for (let index = 0; index < sectionCount; index += 1) {
    const baseId = index * 5 + 1;

    children.push(
      element('h2', [text(`Objective section ${index + 1}`)]),
      paragraph(
        `Give a short answer: {{ input(${baseId}) }} and explain it: ` +
          `{{ textarea(${baseId + 1}) }}`
      ),
      paragraph(
        `Choose a complexity: {{ dropdown(${baseId + 2})` +
          '[O(1),O(log n),O(n),O(n log n)] }}'
      ),
      paragraph(`{{ select(${baseId + 3}) }}`),
      choiceList(baseId + 3),
      paragraph(`{{ multiselect(${baseId + 4}) }}`),
      choiceList(baseId + 4),
      element('blockquote', [
        paragraph('Review every answer before submitting the problem.'),
      ])
    );
  }

  return { type: 'root', children };
}

const SECTIONS = 20;
const sink: { value: unknown } = { value: undefined };

describe('objective problem rendering', () => {
  bench('statement tree construction only (baseline)', () => {
    sink.value = buildObjectiveStatement(SECTIONS);
  });

  bench('transform a 100-question objective statement', () => {
    const tree = buildObjectiveStatement(SECTIONS);
    rehypeObjective()(tree);
    sink.value = tree;
  });
});
