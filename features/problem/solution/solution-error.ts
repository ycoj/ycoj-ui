import parseErrorMessage from '@/shared/components/errored/parse-message';
import type { HydroError } from '@/shared/types/error';

export function solutionErrorMessage(
  error: HydroError,
  translate: (key: 'blocked' | 'conflict' | 'busy') => string
) {
  switch (error.name) {
    case 'SolutionSubmissionBlockedError':
      return translate('blocked');
    case 'SolutionReviewConflictError':
      return translate('conflict');
    case 'SolutionReviewBusyError':
      return translate('busy');
    default:
      return parseErrorMessage(error);
  }
}
