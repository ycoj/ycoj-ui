import { parseProblemContent } from './parse-problem-content';
import { bench, describe } from 'vitest';

function makeBody(paragraphs: number) {
  return Array.from(
    { length: paragraphs },
    (_, index) =>
      `## Part ${index}\n\nGiven an array of $n$ integers, output the answer.\n\n` +
      '```input1\n3\n1 2 3\n```\n\n```output1\n6\n```'
  ).join('\n\n');
}

const body = makeBody(40);

const multiLanguage = JSON.stringify({
  zh: body,
  zh_TW: body,
  en: body,
  jp: '',
});

const plainText = body;

// Keeps results reachable so the engine cannot drop the calls entirely.
const sink: { value: unknown } = { value: undefined };

describe('parseProblemContent', () => {
  bench('multi-language JSON content', () => {
    sink.value = parseProblemContent(multiLanguage);
  });

  bench('plain text content', () => {
    sink.value = parseProblemContent(plainText);
  });

  bench('empty content', () => {
    sink.value = parseProblemContent('   ');
  });
});
