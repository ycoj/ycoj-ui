import {
  buildPreliminarySchema,
  countQuestions,
  type PreliminarySchemaMessages,
} from './preliminary-form-schema';
import type { PreliminaryFormValues } from './preliminary-form-utils';
import { describe, expect, it } from 'vitest';

const messages: PreliminarySchemaMessages = {
  titleRequired: 'titleRequired',
  titleTooLong: 'titleTooLong',
  contentTooLong: 'contentTooLong',
  sectionTitleRequired: 'sectionTitleRequired',
  sectionTitleTooLong: 'sectionTitleTooLong',
  promptRequired: 'promptRequired',
  promptTooLong: 'promptTooLong',
  scoreInvalid: 'scoreInvalid',
  optionTextTooLong: 'optionTextTooLong',
  optionsRequired: 'optionsRequired',
  answerRequired: 'answerRequired',
  answerInvalid: 'answerInvalid',
  explanationTooLong: 'explanationTooLong',
  sectionsRequired: 'sectionsRequired',
  questionsRequired: 'questionsRequired',
  tooManySections: 'tooManySections',
  tooManyQuestions: 'tooManyQuestions',
  tooManyOptions: 'tooManyOptions',
  trueFalseOnlyInReading: 'trueFalseOnlyInReading',
};

function validValues(): PreliminaryFormValues {
  return {
    title: 'CSP-J 2025',
    content: '',
    sections: [
      {
        id: 's1',
        type: 'single_choice',
        title: 'Choice',
        content: '',
        questions: [
          {
            id: 'q1',
            type: 'choice',
            prompt: 'Which one?',
            score: 5,
            explanation: '',
            answer: 'o1',
            options: [
              { id: 'o1', text: 'A' },
              { id: 'o2', text: 'B' },
            ],
          },
        ],
      },
    ],
  };
}

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

describe('buildPreliminarySchema', () => {
  it('accepts a complete paper', () => {
    expect(
      buildPreliminarySchema(messages).safeParse(validValues()).success
    ).toBe(true);
  });

  it.each([
    {
      name: 'missing title',
      mutate: (values: PreliminaryFormValues) => {
        values.title = '  ';
      },
      path: ['title'],
      message: 'titleRequired',
    },
    {
      name: 'no sections',
      mutate: (values: PreliminaryFormValues) => {
        values.sections = [];
      },
      path: ['sections'],
      message: 'sectionsRequired',
    },
    {
      name: 'empty prompt',
      mutate: (values: PreliminaryFormValues) => {
        values.sections[0].questions[0].prompt = '';
      },
      path: ['sections', 0, 'questions', 0, 'prompt'],
      message: 'promptRequired',
    },
    {
      name: 'score out of range',
      mutate: (values: PreliminaryFormValues) => {
        values.sections[0].questions[0].score = 0;
      },
      path: ['sections', 0, 'questions', 0, 'score'],
      message: 'scoreInvalid',
    },
    {
      name: 'single option',
      mutate: (values: PreliminaryFormValues) => {
        values.sections[0].questions[0].options.pop();
      },
      path: ['sections', 0, 'questions', 0, 'options'],
      message: 'optionsRequired',
    },
    {
      name: 'answer referencing a missing option',
      mutate: (values: PreliminaryFormValues) => {
        values.sections[0].questions[0].answer = 'missing';
      },
      path: ['sections', 0, 'questions', 0, 'answer'],
      message: 'answerInvalid',
    },
    {
      name: 'true/false outside program reading',
      mutate: (values: PreliminaryFormValues) => {
        values.sections[0].questions[0].type = 'true_false';
      },
      path: ['sections', 0, 'questions', 0, 'type'],
      message: 'trueFalseOnlyInReading',
    },
  ])('rejects $name', ({ mutate, path, message }) => {
    const values = validValues();
    mutate(values);
    const result = buildPreliminarySchema(messages).safeParse(values);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(
      result.error.issues.some(
        (issue) =>
          issue.message === message &&
          JSON.stringify(issue.path) === JSON.stringify(path)
      )
    ).toBe(true);
  });

  it('accepts true/false inside program reading', () => {
    const values = validValues();
    values.sections[0].type = 'program_reading';
    values.sections[0].content = 'program';
    values.sections[0].questions[0] = {
      id: 'q1',
      type: 'true_false',
      prompt: 'Is it true?',
      score: 2,
      explanation: '',
      answer: 'false',
      options: [],
    };
    expect(buildPreliminarySchema(messages).safeParse(values).success).toBe(
      true
    );
  });

  it.each([
    {
      name: 'paper title over 64 characters',
      mutate: (values: PreliminaryFormValues) => {
        values.title = 't'.repeat(65);
      },
      message: 'titleTooLong',
    },
    {
      name: 'section title over 255 characters',
      mutate: (values: PreliminaryFormValues) => {
        values.sections[0].title = 't'.repeat(256);
      },
      message: 'sectionTitleTooLong',
    },
    {
      name: 'prompt over 16384 characters',
      mutate: (values: PreliminaryFormValues) => {
        values.sections[0].questions[0].prompt = 'p'.repeat(16385);
      },
      message: 'promptTooLong',
    },
    {
      name: 'option text over 8192 characters',
      mutate: (values: PreliminaryFormValues) => {
        values.sections[0].questions[0].options[0].text = 'o'.repeat(8193);
      },
      message: 'optionTextTooLong',
    },
    {
      name: 'explanation over 32768 characters',
      mutate: (values: PreliminaryFormValues) => {
        values.sections[0].questions[0].explanation = 'e'.repeat(32769);
      },
      message: 'explanationTooLong',
    },
    {
      name: 'introduction over 65535 characters',
      mutate: (values: PreliminaryFormValues) => {
        values.content = 'c'.repeat(65536);
      },
      message: 'contentTooLong',
    },
  ])('rejects $name', ({ mutate, message }) => {
    const values = validValues();
    mutate(values);
    const result = buildPreliminarySchema(messages).safeParse(values);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((issue) => issue.message === message)).toBe(
      true
    );
  });

  it('accepts text fields exactly at the backend limits', () => {
    const values = validValues();
    values.title = 't'.repeat(64);
    values.content = 'c'.repeat(65535);
    values.sections[0].title = 's'.repeat(255);
    values.sections[0].questions[0].prompt = 'p'.repeat(16384);
    values.sections[0].questions[0].explanation = 'e'.repeat(32768);
    values.sections[0].questions[0].options[0].text = 'o'.repeat(8192);
    expect(buildPreliminarySchema(messages).safeParse(values).success).toBe(
      true
    );
  });
});
