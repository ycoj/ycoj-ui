import {
  buildAllowedAnswers,
  getAlphabeticId,
  getQuestionDisplayNumber,
} from './preliminary-utils';
import { describe, expect, it } from 'vitest';

describe('getAlphabeticId', () => {
  it.each([
    [0, 'A'],
    [1, 'B'],
    [25, 'Z'],
    [26, 'AA'],
    [27, 'AB'],
  ])('maps %i to %s', (index, expected) => {
    expect(getAlphabeticId(index)).toBe(expected);
  });
});

describe('getQuestionDisplayNumber', () => {
  it.each([
    [{ questionNumber: 7 }, 0, 7],
    [{ questionNumber: 7 }, 5, 7],
    [{}, 0, 1],
    [{}, 4, 5],
    [{ questionNumber: undefined }, 2, 3],
  ])(
    'prefers questionNumber over global index %j %i',
    (question, index, expected) => {
      expect(getQuestionDisplayNumber(question, index)).toBe(expected);
    }
  );
});

describe('buildAllowedAnswers', () => {
  it('maps choice questions to their option ids', () => {
    expect(
      buildAllowedAnswers([
        {
          questions: [
            {
              id: 'q1',
              type: 'choice',
              options: [{ id: 'o1' }, { id: 'o2' }],
            },
          ],
        },
      ])
    ).toEqual({ q1: ['o1', 'o2'] });
  });

  it('maps true/false questions to fixed literals regardless of options', () => {
    expect(
      buildAllowedAnswers([
        {
          questions: [{ id: 'q1', type: 'true_false', options: [] }],
        },
      ])
    ).toEqual({ q1: ['true', 'false'] });
  });

  it('collects questions across sections and tolerates missing options', () => {
    expect(
      buildAllowedAnswers([
        {
          questions: [
            { id: 'q1', type: 'choice' },
            { id: 'q2', type: 'true_false' },
          ],
        },
        {
          questions: [{ id: 'q3', type: 'choice', options: [{ id: 'o9' }] }],
        },
      ])
    ).toEqual({
      q1: [],
      q2: ['true', 'false'],
      q3: ['o9'],
    });
  });
});
