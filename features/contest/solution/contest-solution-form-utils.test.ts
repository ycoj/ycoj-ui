import {
  CONTEST_SOLUTION_CONTENT_MAX_LENGTH,
  CONTEST_SOLUTION_TITLE_MAX_LENGTH,
  buildContestSolutionSchema,
} from './contest-solution-form-utils';
import { describe, expect, it } from 'vitest';

const messages = {
  titleRequired: 'titleRequired',
  titleTooLong: 'titleTooLong',
  contentRequired: 'contentRequired',
  contentTooLong: 'contentTooLong',
};

const schema = buildContestSolutionSchema(messages);

describe('contest solution schema', () => {
  const cases: {
    title: string;
    content: string;
    error: keyof typeof messages;
  }[] = [
    { title: '', content: 'Answer', error: 'titleRequired' },
    { title: '   ', content: 'Answer', error: 'titleRequired' },
    {
      title: 'a'.repeat(CONTEST_SOLUTION_TITLE_MAX_LENGTH + 1),
      content: 'Answer',
      error: 'titleTooLong',
    },
    { title: 'Editorial', content: '', error: 'contentRequired' },
    { title: 'Editorial', content: '   \n  ', error: 'contentRequired' },
    {
      title: 'Editorial',
      content: 'a'.repeat(CONTEST_SOLUTION_CONTENT_MAX_LENGTH + 1),
      error: 'contentTooLong',
    },
  ];
  it.each(cases)(
    'rejects $error for title=$title',
    ({ title, content, error }) => {
      const result = schema.safeParse({ title, content });
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0]?.message).toBe(messages[error]);
    }
  );

  it.each([
    { title: 'Editorial', content: 'Answer' },
    {
      title: 'a'.repeat(CONTEST_SOLUTION_TITLE_MAX_LENGTH),
      content: 'a'.repeat(CONTEST_SOLUTION_CONTENT_MAX_LENGTH),
    },
    {
      title: '  Editorial  ',
      content: ` \n${'a'.repeat(CONTEST_SOLUTION_CONTENT_MAX_LENGTH)}\n `,
    },
  ])('accepts boundary values %#', ({ title, content }) => {
    expect(schema.safeParse({ title, content }).success).toBe(true);
  });

  it('trims surrounding whitespace to match the backend contract', () => {
    const parsed = schema.safeParse({
      title: '  Editorial  ',
      content: '  Answer\n',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success)
      expect(parsed.data).toEqual({ title: 'Editorial', content: 'Answer' });
  });
});
