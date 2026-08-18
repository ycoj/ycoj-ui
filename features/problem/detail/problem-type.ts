import type { PublicProjectionProblem } from '@/shared/types/problem';

export function isFileIoProblem(
  problem: Pick<PublicProjectionProblem, 'config'>
) {
  return problem.config?.type === 'default' && Boolean(problem.config.subType);
}
