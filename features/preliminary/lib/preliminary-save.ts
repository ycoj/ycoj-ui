import ClientApis from '@/api/client/method';
import {
  buildPreliminaryPayload,
  type PreliminaryFormValues,
} from '@/features/preliminary/form/preliminary-form-utils';
import { PreliminaryRequestError } from '@/features/preliminary/lib/preliminary-error';

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
    throw new PreliminaryRequestError();
  return `/preliminary/${response.paperId}`;
}
