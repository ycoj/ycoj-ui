import type { CreatePasteRequest } from '@/api/client/method/paste/create';
import type { PasteDoc, PasteFormOptions } from '@/shared/types/paste';
import { z } from 'zod';

export function createPasteSchema(messages: {
  titleTooLong: string;
  contentRequired: string;
  contentTooLong: string;
  languageInvalid: string;
}) {
  return z.object({
    title: z.string().max(64, messages.titleTooLong),
    mode: z.enum(['code', 'markdown']),
    language: z.string().regex(/^[a-z0-9-]{0,64}$/i, messages.languageInvalid),
    content: z
      .string()
      .min(1, messages.contentRequired)
      .max(65536, messages.contentTooLong),
    expire: z.enum(['day', 'week', 'month', 'never']),
  });
}

export type PasteFormValues = z.infer<ReturnType<typeof createPasteSchema>>;

export function getPasteDefaults(
  options: PasteFormOptions,
  paste?: PasteDoc
): PasteFormValues {
  return {
    title: paste?.title ?? '',
    mode: paste?.mode ?? 'code',
    language: paste?.language ?? options.defaultLanguage,
    content: paste?.content ?? '',
    expire: paste?.expire ?? options.defaultExpire,
  };
}

export function getPasteLanguageOptions(
  names: Record<string, string>,
  language: string
) {
  return Object.hasOwn(names, language)
    ? names
    : { ...names, [language]: language };
}

export function buildPastePayload(values: PasteFormValues): CreatePasteRequest {
  return {
    title: values.title,
    mode: values.mode,
    language: values.mode === 'code' ? values.language : '',
    content: values.content,
    expire: values.expire,
  };
}
