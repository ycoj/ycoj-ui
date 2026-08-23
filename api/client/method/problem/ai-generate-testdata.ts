import { clientRequest } from '@/api/client';
import type { AiGenerateTestdataRequest } from '@/shared/types/ai-generation';
import type { Errorable } from '@/shared/types/error';

export type { AiGenerateTestdataRequest } from '@/shared/types/ai-generation';

export type AiGenerateTestdataResponse = Errorable<{
  rid: string;
}>;

export const generateAiTestdata = (
  pid: string | number,
  request: AiGenerateTestdataRequest
) =>
  clientRequest.Post<AiGenerateTestdataResponse>(`/p/${pid}/generate`, request);
