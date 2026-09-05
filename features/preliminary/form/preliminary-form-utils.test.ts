import {
  buildPreliminaryPayload,
  countQuestions,
  getPreliminaryCreateDefaults,
  getSectionTypeLabel,
  mapPreliminaryEditToFormValues,
  newId,
  newQuestion,
  newSection,
} from './preliminary-form-utils';
import { describe, expect, it } from 'vitest';

describe('countQuestions', () => {
  it('sums questions across sections', () => {
    expect(
      countQuestions([
        { questions: [1, 2] },
        { questions: [] },
        { questions: [3] },
      ])
    ).toBe(3);
  });
});

describe('getSectionTypeLabel', () => {
  const t = (key: string) => key;

  it.each([
    { type: 'single_choice' as const, expected: 'singleChoice' },
    { type: 'program_reading' as const, expected: 'programReading' },
    { type: 'program_completion' as const, expected: 'programCompletion' },
    { type: undefined, expected: 'singleChoice' },
  ])('labels $type as $expected', ({ type, expected }) => {
    expect(getSectionTypeLabel(type, t)).toBe(expected);
  });
});

describe('newQuestion', () => {
  it('creates a choice question with four options and a valid default answer', () => {
    const question = newQuestion('choice');
    expect(question.type).toBe('choice');
    expect(question.options).toHaveLength(4);
    expect(
      question.options.some((option) => option.id === question.answer)
    ).toBe(true);
  });

  it('creates a true/false question without options', () => {
    const question = newQuestion('true_false');
    expect(question.answer).toBe('true');
    expect(question.options).toHaveLength(0);
  });
});

describe('newSection', () => {
  it('seeds program-reading sections with a true/false question', () => {
    expect(newSection('program_reading', 'Reading').questions[0].type).toBe(
      'true_false'
    );
  });

  it('seeds other sections with a choice question', () => {
    expect(newSection('single_choice', 'Choice').questions[0].type).toBe(
      'choice'
    );
    expect(newSection('program_completion', 'Fill').questions[0].type).toBe(
      'choice'
    );
  });
});

describe('getPreliminaryCreateDefaults', () => {
  it('starts with an empty paper', () => {
    expect(getPreliminaryCreateDefaults()).toEqual({
      title: '',
      content: '',
      sections: [],
    });
  });
});

describe('buildPreliminaryPayload', () => {
  it('trims text fields and keeps explanations', () => {
    const payload = buildPreliminaryPayload({
      title: '  CSP-J  ',
      content: ' intro ',
      sections: [
        {
          id: 's1',
          type: 'single_choice',
          title: ' Choice ',
          content: '',
          questions: [
            {
              id: 'q1',
              type: 'choice',
              prompt: 'prompt',
              score: 5,
              explanation: 'why',
              answer: 'o1',
              options: [
                { id: 'o1', text: 'A' },
                { id: 'o2', text: 'B' },
              ],
            },
            {
              id: 'q2',
              type: 'true_false',
              prompt: 'prompt',
              score: 2,
              explanation: '',
              answer: 'true',
              options: [],
            },
          ],
        },
      ],
    });
    expect(payload.title).toBe('CSP-J');
    expect(payload.sections[0].title).toBe('Choice');
    expect(payload.sections[0].questions[0].explanation).toBe('why');
    expect(payload.sections[0].questions[1].options).toEqual([]);
  });

  it.each([NaN, Infinity, -Infinity])(
    'coerces non-finite score %s to the default',
    (score) => {
      const payload = buildPreliminaryPayload({
        title: 'Paper',
        content: '',
        sections: [
          {
            id: 's1',
            type: 'single_choice',
            title: 'S',
            content: '',
            questions: [
              {
                id: 'q1',
                type: 'choice',
                prompt: 'p',
                score,
                explanation: '',
                answer: 'o1',
                options: [{ id: 'o1', text: 'A' }],
              },
            ],
          },
        ],
      });
      expect(payload.sections[0].questions[0].score).toBe(2);
    }
  );
});

describe('newId', () => {
  it('falls back when randomUUID is unavailable', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      configurable: true,
    });
    try {
      expect(newId()).toMatch(/^id-/);
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, 'crypto', descriptor);
      }
    }
  });

  it('uses getRandomValues when randomUUID is unavailable', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    const realCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        getRandomValues: realCrypto.getRandomValues.bind(realCrypto),
      },
      configurable: true,
    });
    try {
      const first = newId();
      const second = newId();
      expect(first).toMatch(/^id-[0-9a-f]{32}$/);
      expect(second).toMatch(/^id-[0-9a-f]{32}$/);
      expect(first).not.toBe(second);
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, 'crypto', descriptor);
      }
    }
  });
});

describe('mapPreliminaryEditToFormValues', () => {
  it('fills missing ids and preserves explanations', () => {
    const values = mapPreliminaryEditToFormValues({
      title: 'Paper',
      content: '',
      sections: [
        {
          id: '',
          type: 'single_choice',
          title: 'S',
          content: '',
          questions: [
            {
              id: 'q1',
              type: 'choice',
              prompt: 'p',
              score: 3,
              explanation: 'because',
              answer: 'o1',
              options: [{ id: '', text: 'A' }],
            },
          ],
        },
      ],
    });
    expect(values.sections[0].id).not.toBe('');
    expect(values.sections[0].questions[0].explanation).toBe('because');
    expect(values.sections[0].questions[0].options[0].id).not.toBe('');
  });
});
