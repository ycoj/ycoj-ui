import type { SaveContestSolutionPayload } from '@/api/client/method/contest/solution';
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

/**
 * Build the transport payload from validated form values.
 *
 * Schema `.trim()` is the canonical trim point for validated input. This
 * re-trim is defense for unvalidated callers so the transport still matches
 * the backend contract, which counts length excluding surrounding whitespace.
 */
export function normalizeContestSolutionPayload(
  values: ContestSolutionFormValues
): SaveContestSolutionPayload {
  return {
    title: values.title.trim(),
    content: values.content.trim(),
  };
}

export function getContestSolutionDefaults(): ContestSolutionFormValues {
  return {
    title: '',
    content: '',
  };
}
