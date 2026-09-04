import ClientApis from '@/api/client/method';
import {
  buildPreliminaryPayload,
  type PreliminaryFormValues,
} from '@/features/preliminary/form/preliminary-form-utils';

export const SAVE_PRELIMINARY_FAILED = 'submitFailed';

export async function savePreliminaryValues(
  values: PreliminaryFormValues,
  published: boolean,
  paperId?: string
): Promise<string> {
  const response = await ClientApis.Preliminary.savePreliminary(
    buildPreliminaryPayload(values),
    published,
    paperId
  ).send();
  if (!response || 'error' in response || !response.paperId)
    throw new Error(SAVE_PRELIMINARY_FAILED);
  return `/preliminary/${response.paperId}`;
}
