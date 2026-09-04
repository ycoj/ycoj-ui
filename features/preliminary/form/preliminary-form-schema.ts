import { countQuestions } from './preliminary-form-utils';
import { z } from 'zod';

export type PreliminarySchemaMessages = {
  titleRequired: string;
  sectionTitleRequired: string;
  promptRequired: string;
  scoreInvalid: string;
  optionsRequired: string;
  answerRequired: string;
  answerInvalid: string;
  sectionsRequired: string;
  questionsRequired: string;
  tooManySections: string;
  tooManyQuestions: string;
  tooManyOptions: string;
  trueFalseOnlyInReading: string;
};

const TRUE_FALSE_VALUES = ['true', 'false'] as const;

// Strict schema for publishing: mirrors backend normalizePreliminaryDefinition
// with requireComplete (see YCOJ packages/hydrooj/src/lib/preliminary.ts).
// IDs are system-generated (crypto.randomUUID) and never user-edited, so the
// schema does not validate their format or uniqueness: such failures could
// never be fixed via the UI.
export function buildPreliminarySchema(messages: PreliminarySchemaMessages) {
  const optionSchema = z.object({
    id: z.string(),
    text: z.string(),
  });

  const questionSchema = z
    .object({
      id: z.string(),
      type: z.enum(['choice', 'true_false']),
      prompt: z.string().trim().min(1, messages.promptRequired),
      score: z
        .number({ invalid_type_error: messages.scoreInvalid })
        .int(messages.scoreInvalid)
        .min(1, messages.scoreInvalid)
        .max(1000, messages.scoreInvalid),
      explanation: z.string(),
      answer: z.string().trim().min(1, messages.answerRequired),
      options: z.array(optionSchema).max(26, messages.tooManyOptions),
    })
    .superRefine((question, ctx) => {
      if (question.type === 'true_false') {
        if (
          !(TRUE_FALSE_VALUES as readonly string[]).includes(question.answer)
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
      title: z.string().trim().min(1, messages.sectionTitleRequired),
      content: z.string(),
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
      title: z.string().trim().min(1, messages.titleRequired),
      content: z.string(),
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
