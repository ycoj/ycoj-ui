import ClientApis from '@/api/client/method';
import { PreliminaryRequestError } from '@/features/preliminary/lib/preliminary-error';
import type { PreliminaryAnswers } from '@/shared/types/preliminary';

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
