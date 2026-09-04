import { clientRequest } from '@/api/client';
import type { PreliminaryDefinitionInput } from '@/shared/types/preliminary';
import type { ObjectId } from '@/shared/types/shared';

export type SavePreliminaryResponse = {
  paperId: ObjectId;
  url: string;
};

export const savePreliminary = (
  definition: PreliminaryDefinitionInput,
  published: boolean,
  paperId?: string
) =>
  clientRequest.Post<SavePreliminaryResponse>(
    paperId ? `/preliminary/${paperId}/edit` : '/preliminary/create',
    {
      operation: 'save',
      definition,
      published,
    }
  );
