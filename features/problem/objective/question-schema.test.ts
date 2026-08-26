import { sanitizeAnswers, type ObjectiveQuestion } from './question-schema';
import { describe, expect, it } from 'vitest';

const questions: ObjectiveQuestion[] = [
  { id: '1', type: 'input' },
  { id: '2', type: 'textarea' },
  { id: '3', type: 'dropdown', options: ['a', 'b'] },
  { id: '4', type: 'select', options: ['A', 'B', 'C'] },
  { id: '5', type: 'multiselect', options: ['A', 'B', 'C'] },
];

describe('sanitizeAnswers', () => {
  it('keeps valid restored drafts intact', () => {
    const draft = {
      '1': 'hello',
      '2': '  long answer  ',
      '3': 'a',
      '4': 'B',
      '5': ['A', 'C'],
    };
    expect(sanitizeAnswers(draft, questions)).toEqual(draft);
  });

  it('returns the same reference when nothing changed', () => {
    const draft = { '1': 'hello' };
    expect(sanitizeAnswers(draft, questions)).toBe(draft);
  });

  it('discards answers for removed questions', () => {
    expect(sanitizeAnswers({ '1': 'hi', '99': 'gone' }, questions)).toEqual({
      '1': 'hi',
    });
  });

  it('discards everything when the statement has no questions', () => {
    expect(sanitizeAnswers({ '1': 'hi' }, [])).toEqual({});
  });

  it('discards answers whose value type no longer matches the control type', () => {
    // question 1 changed from multiselect to input
    expect(sanitizeAnswers({ '1': ['A', 'B'] }, questions)).toEqual({});
    // question 5 changed from input to multiselect
    expect(sanitizeAnswers({ '5': 'text' }, questions)).toEqual({});
  });

  it('discards dropdown values outside the allowed options', () => {
    expect(sanitizeAnswers({ '3': 'c' }, questions)).toEqual({});
    expect(sanitizeAnswers({ '3': 'b' }, questions)).toEqual({ '3': 'b' });
  });

  it('discards select values outside the allowed options', () => {
    expect(sanitizeAnswers({ '4': 'D' }, questions)).toEqual({});
    expect(sanitizeAnswers({ '4': 'A' }, questions)).toEqual({ '4': 'A' });
  });

  it('filters invalid options out of multiselect answers', () => {
    expect(sanitizeAnswers({ '5': ['A', 'X'] }, questions)).toEqual({
      '5': ['A'],
    });
  });

  it('discards multiselect answers with no valid option left', () => {
    expect(sanitizeAnswers({ '5': ['X', 'Y'] }, questions)).toEqual({});
    expect(sanitizeAnswers({ '5': [] }, questions)).toEqual({});
  });

  it('allows choice values when options are unknown', () => {
    const noOptions: ObjectiveQuestion[] = [
      { id: '1', type: 'select' },
      { id: '2', type: 'multiselect' },
    ];
    expect(sanitizeAnswers({ '1': 'A', '2': ['B'] }, noOptions)).toEqual({
      '1': 'A',
      '2': ['B'],
    });
  });
});
