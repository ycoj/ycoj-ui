import {
  buildAllowedAnswers,
  getAlphabeticId,
  getPreliminaryNavQuestions,
  getPreliminarySectionStarts,
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
              options: [
                { id: 'o1', text: 'A' },
                { id: 'o2', text: 'B' },
              ],
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
          questions: [
            { id: 'q3', type: 'choice', options: [{ id: 'o9', text: 'A' }] },
          ],
        },
      ])
    ).toEqual({
      q1: [],
      q2: ['true', 'false'],
      q3: ['o9'],
    });
  });
});

describe('getPreliminarySectionStarts', () => {
  it('pairs each section with its starting global index', () => {
    const sections = [
      { id: 's1', questions: [{ id: 'q1' }, { id: 'q2' }] },
      { id: 's2', questions: [] },
      { id: 's3', questions: [{ id: 'q3' }] },
    ];
    expect(getPreliminarySectionStarts(sections)).toEqual([
      { section: sections[0], start: 0 },
      { section: sections[1], start: 2 },
      { section: sections[2], start: 2 },
    ]);
  });
});

describe('getPreliminaryNavQuestions', () => {
  it('numbers questions with a global index across sections', () => {
    expect(
      getPreliminaryNavQuestions([
        { questions: [{ id: 'q1' }, { id: 'q2' }] },
        { questions: [{ id: 'q3' }] },
      ])
    ).toEqual([
      { id: 'q1', number: 1 },
      { id: 'q2', number: 2 },
      { id: 'q3', number: 3 },
    ]);
  });

  it('prefers backend question numbers', () => {
    expect(
      getPreliminaryNavQuestions([
        { questions: [{ id: 'q1', questionNumber: 7 }, { id: 'q2' }] },
      ])
    ).toEqual([
      { id: 'q1', number: 7 },
      { id: 'q2', number: 2 },
    ]);
  });
});
