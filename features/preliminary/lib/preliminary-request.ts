import ClientApis from '@/api/client/method';
import {
  buildPreliminaryPayload,
  type PreliminaryFormValues,
} from '@/features/preliminary/form/preliminary-form-utils';
import { normalizeBackendPathname } from '@/shared/lib/backend-response';
import type { PreliminaryAnswers } from '@/shared/types/preliminary';

// Shared failure signal for preliminary save/submit. Use instanceof to
// distinguish expected request failures from backend messages; the message
// stays unique so it never collides with i18n keys or backend copy. The
// backend payload is preserved on backendError (e.g. ValidationError for a
// stale revision, OpcountExceededError for rate limits) so callers can branch
// on it while the UI keeps its generic copy as fallback.
export class PreliminaryRequestError extends Error {
  backendError?: unknown;

  constructor(message = 'PreliminaryRequestFailed', backendError?: unknown) {
    super(message);
    this.name = 'PreliminaryRequestError';
    this.backendError = backendError;
  }
}

function getBackendError(response: unknown): unknown {
  if (response && typeof response === 'object' && 'error' in response) {
    return (response as { error: unknown }).error;
  }
  return undefined;
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
    throw new PreliminaryRequestError(
      'PreliminaryRequestFailed',
      getBackendError(response)
    );
  // Trust the backend-provided redirect and only synthesize the detail path
  // when it is missing. Strip the /d/<domain> prefix so router.push works on
  // non-root domains.
  return normalizeBackendPathname(
    response.url ?? `/preliminary/${response.paperId}`
  );
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
    throw new PreliminaryRequestError(
      'PreliminaryRequestFailed',
      getBackendError(response)
    );
  }
  try {
    await clearAnswers();
  } catch {
    // Draft cleanup is best-effort; the attempt was recorded.
  }
  return normalizeBackendPathname(response.url);
}
