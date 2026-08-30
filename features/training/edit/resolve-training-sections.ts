import type { ProblemAutoCompleteItem } from '@/api/client/method/problem/auto-complete';
import type { TrainingSectionValue } from '@/features/training/form/training-form-utils';
import type { ProblemDict } from '@/shared/types/problem';
import type { TrainingNode } from '@/shared/types/training';

function resolveSectionProblem(
  pid: number,
  pdict: ProblemDict
): ProblemAutoCompleteItem {
  const problem = pdict[pid];
  if (problem?.docId === pid) {
    return {
      docId: pid,
      title: problem.title,
      ...(problem.pid !== undefined ? { pid: problem.pid } : {}),
    };
  }
  return { docId: pid, title: String(pid) };
}

export function resolveTrainingSections(
  dag: TrainingNode[],
  pdict: ProblemDict
): TrainingSectionValue[] {
  return dag.map((node) => ({
    id: node._id,
    title: node.title,
    requireNids: node.requireNids ?? [],
    pids: (node.pids ?? []).map((pid) => resolveSectionProblem(pid, pdict)),
  }));
}
