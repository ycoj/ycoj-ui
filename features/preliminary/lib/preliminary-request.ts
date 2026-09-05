import ClientApis from '@/api/client/method';
import {
  buildPreliminaryPayload,
  type PreliminaryFormValues,
} from '@/features/preliminary/form/preliminary-form-utils';
import type { PreliminaryAnswers } from '@/shared/types/preliminary';

// Shared failure signal for preliminary save/submit. Use instanceof to
// distinguish expected request failures from backend messages; the message
// stays unique so it never collides with i18n keys or backend copy.
export class PreliminaryRequestError extends Error {
  constructor() {
    super('PreliminaryRequestFailed');
    this.name = 'PreliminaryRequestError';
  }
}

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
  if (!response || 'error' in response || (!response.url && !response.paperId))
    throw new PreliminaryRequestError();
  // Trust the backend-provided redirect and only synthesize the detail path
  // when it is missing.
  return response.url ?? `/preliminary/${response.paperId}`;
}

export async function submitPreliminaryAnswers(
  paperId: string,
  revision: number,
  answers: PreliminaryAnswers,
  clearAnswers: () => Promise<void>
): Promise<string> {
  const response = await ClientApis.Preliminary.submitPreliminary(
    paperId,
    revision,
    answers
  ).send();
  if (!response || 'error' in response || !response.url) {
    throw new PreliminaryRequestError();
  }
  try {
    await clearAnswers();
  } catch {
    // Draft cleanup is best-effort; the attempt was recorded.
  }
  return response.url;
}
