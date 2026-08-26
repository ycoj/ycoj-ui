import {
  getDraftId,
  getEventKind,
  isAnswerCompleted,
  serializeAnswersForSubmit,
} from './draft-utils';
import { describe, expect, it } from 'vitest';

describe('isAnswerCompleted', () => {
  it('returns false for undefined', () => {
    expect(isAnswerCompleted(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isAnswerCompleted('')).toBe(false);
  });

  it('returns false for whitespace-only string', () => {
    expect(isAnswerCompleted('   ')).toBe(false);
    expect(isAnswerCompleted('\n\t ')).toBe(false);
  });

  it('returns true for non-empty string', () => {
    expect(isAnswerCompleted('a')).toBe(true);
    expect(isAnswerCompleted('  x  ')).toBe(true);
  });

  it('returns false for empty array', () => {
    expect(isAnswerCompleted([])).toBe(false);
  });

  it('returns true for non-empty array', () => {
    expect(isAnswerCompleted(['A'])).toBe(true);
    expect(isAnswerCompleted(['A', 'B'])).toBe(true);
  });
});

describe('serializeAnswersForSubmit', () => {
  it('filters empty and whitespace strings', () => {
    expect(
      serializeAnswersForSubmit({ '1': '', '2': '   ', '3': 'hello' })
    ).toEqual({ '3': 'hello' });
  });

  it('filters empty arrays', () => {
    expect(serializeAnswersForSubmit({ '1': [], '2': ['A'], '3': [] })).toEqual(
      { '2': ['A'] }
    );
  });

  it('keeps mixed valid entries', () => {
    expect(
      serializeAnswersForSubmit({
        '1': 'answer',
        '2': ['A', 'B'],
        '3': '',
        '4': [],
      })
    ).toEqual({ '1': 'answer', '2': ['A', 'B'] });
  });

  it('returns empty object when all filtered', () => {
    expect(serializeAnswersForSubmit({ '1': '', '2': [] })).toEqual({});
  });

  it('trims check but keeps original value', () => {
    expect(serializeAnswersForSubmit({ '1': '  hi  ' })).toEqual({
      '1': '  hi  ',
    });
  });
});

describe('getEventKind', () => {
  it('returns standalone for null', () => {
    expect(getEventKind(null)).toBe('standalone');
  });

  it('returns standalone for undefined', () => {
    expect(getEventKind(undefined)).toBe('standalone');
  });

  it('returns homework when rule is homework', () => {
    expect(getEventKind({ rule: 'homework' })).toBe('homework');
  });

  it('returns contest for other rules', () => {
    expect(getEventKind({ rule: 'contest' })).toBe('contest');
    expect(getEventKind({ rule: 'other' })).toBe('contest');
  });

  it('returns contest when rule is undefined', () => {
    expect(getEventKind({})).toBe('contest');
  });
});

describe('getDraftId', () => {
  it('serializes all fields', () => {
    expect(getDraftId(1, 'domain', 42, 'standalone', null)).toBe(
      JSON.stringify([1, 'domain', 42, 'standalone', null])
    );
  });

  it('handles string userId and tid', () => {
    expect(getDraftId('u1', 'd1', 100, 'homework', 'tid123')).toBe(
      JSON.stringify(['u1', 'd1', 100, 'homework', 'tid123'])
    );
  });

  it('handles null userId', () => {
    expect(getDraftId(null, 'domain', 1, 'contest', undefined)).toBe(
      JSON.stringify([null, 'domain', 1, 'contest', undefined])
    );
  });

  it('distinguishes kinds and tids', () => {
    const a = getDraftId(1, 'd', 1, 'standalone', null);
    const b = getDraftId(1, 'd', 1, 'homework', null);
    const c = getDraftId(1, 'd', 1, 'standalone', 'tid');
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});
