import { alova } from '@/api/server';
import type { AiGenerationOptions } from '@/shared/types/ai-generation';
import type { Errorable } from '@/shared/types/error';

export type AiGenerationOptionsResponse = Errorable<AiGenerationOptions>;

export const getAiGenerationOptions = (pid: string | number) =>
  alova.Get<AiGenerationOptionsResponse>(`/p/${pid}/generate`);
