import { z } from 'zod';

export const CONTEST_SOLUTION_TITLE_MAX_LENGTH = 64;
export const CONTEST_SOLUTION_CONTENT_MAX_LENGTH = 65535;

export type ContestSolutionSchemaMessages = {
  titleRequired: string;
  titleTooLong: string;
  contentRequired: string;
  contentTooLong: string;
};

export function buildContestSolutionSchema(
  messages: ContestSolutionSchemaMessages
) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, messages.titleRequired)
      .max(CONTEST_SOLUTION_TITLE_MAX_LENGTH, messages.titleTooLong),
    content: z
      .string()
      .trim()
      .min(1, messages.contentRequired)
      .max(CONTEST_SOLUTION_CONTENT_MAX_LENGTH, messages.contentTooLong),
  });
}

export type ContestSolutionFormValues = z.infer<
  ReturnType<typeof buildContestSolutionSchema>
>;
