import { clientRequest } from '@/api/client';
import type { Errorable } from '@/shared/types/error';

export type AiGenerateTestdataRequest = {
  domainId: string;
  id: number | string;
  instructions?: string;
};

export type AiGenerateTestdataResponse = Errorable<{
  rid: string;
}>;

export const generateAiTestdata = (request: AiGenerateTestdataRequest) =>
  clientRequest.Post<AiGenerateTestdataResponse>(
    '/api/problem.aiGenerateTestdata',
    {
      args: request,
    }
  );
