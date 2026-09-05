import { PRELIMINARY_TRUE_FALSE_VALUES } from '@/shared/types/preliminary';
import { z } from 'zod';

export type PreliminarySchemaMessages = {
  titleRequired: string;
  titleTooLong: string;
  contentTooLong: string;
  sectionTitleRequired: string;
  sectionTitleTooLong: string;
  promptRequired: string;
  promptTooLong: string;
  scoreInvalid: string;
  optionTextTooLong: string;
  optionsRequired: string;
  answerRequired: string;
  answerInvalid: string;
  explanationTooLong: string;
  sectionsRequired: string;
  questionsRequired: string;
  tooManySections: string;
  tooManyQuestions: string;
  tooManyOptions: string;
  trueFalseOnlyInReading: string;
};

export function countQuestions(sections: { questions: unknown[] }[]): number {
  return sections.reduce((sum, section) => sum + section.questions.length, 0);
}

// Strict schema for publishing: mirrors backend normalizePreliminaryDefinition
// with requireComplete (see YCOJ packages/hydrooj/src/lib/preliminary.ts).
// Length caps match the backend text() limits exactly so publish-time errors
// surface as form errors instead of save failures. IDs are system-generated
// (crypto.randomUUID) and never user-edited, so the schema does not validate
// their format or uniqueness: such failures could never be fixed via the UI,
// and the backend rejects duplicate identifiers as save errors.
export function buildPreliminarySchema(messages: PreliminarySchemaMessages) {
  const optionSchema = z.object({
    id: z.string(),
    text: z.string().max(8192, messages.optionTextTooLong),
  });

  const questionSchema = z
    .object({
      id: z.string(),
      type: z.enum(['choice', 'true_false']),
      prompt: z
        .string()
        .trim()
        .min(1, messages.promptRequired)
        .max(16384, messages.promptTooLong),
      score: z
        .number({ invalid_type_error: messages.scoreInvalid })
        .int(messages.scoreInvalid)
        .min(1, messages.scoreInvalid)
        .max(1000, messages.scoreInvalid),
      explanation: z.string().max(32768, messages.explanationTooLong),
      answer: z.string().trim().min(1, messages.answerRequired),
      options: z.array(optionSchema).max(26, messages.tooManyOptions),
    })
    .superRefine((question, ctx) => {
      if (question.type === 'true_false') {
        if (
          !(PRELIMINARY_TRUE_FALSE_VALUES as readonly string[]).includes(
            question.answer
          )
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['answer'],
            message: messages.answerInvalid,
          });
        }
        return;
      }
      if (question.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options'],
          message: messages.optionsRequired,
        });
      }
      if (
        question.answer &&
        !question.options.some((option) => option.id === question.answer)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['answer'],
          message: messages.answerInvalid,
        });
      }
    });

  const sectionSchema = z
    .object({
      id: z.string(),
      type: z.enum(['single_choice', 'program_reading', 'program_completion']),
      title: z
        .string()
        .trim()
        .min(1, messages.sectionTitleRequired)
        .max(255, messages.sectionTitleTooLong),
      content: z.string().max(65535, messages.contentTooLong),
      questions: z.array(questionSchema).min(1, messages.questionsRequired),
    })
    .superRefine((section, ctx) => {
      section.questions.forEach((question, index) => {
        if (
          question.type === 'true_false' &&
          section.type !== 'program_reading'
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['questions', index, 'type'],
            message: messages.trueFalseOnlyInReading,
          });
        }
      });
    });

  return z
    .object({
      title: z
        .string()
        .trim()
        .min(1, messages.titleRequired)
        .max(64, messages.titleTooLong),
      content: z.string().max(65535, messages.contentTooLong),
      sections: z
        .array(sectionSchema)
        .min(1, messages.sectionsRequired)
        .max(100, messages.tooManySections),
    })
    .superRefine((values, ctx) => {
      const total = countQuestions(values.sections);
      if (total > 200) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sections'],
          message: messages.tooManyQuestions,
        });
      }
    });
}

export type PreliminaryStrictValues = z.infer<
  ReturnType<typeof buildPreliminarySchema>
>;
