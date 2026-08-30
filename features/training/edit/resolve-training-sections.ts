import type { TrainingSectionValue } from '@/features/training/form/training-form-utils';
import type { ProblemDict } from '@/shared/types/problem';
import type { TrainingNode } from '@/shared/types/training';

export function resolveTrainingSections(
  dag: TrainingNode[],
  pdict: ProblemDict
): TrainingSectionValue[] {
  return dag.map((node) => ({
    id: node._id,
    title: node.title,
    requireNids: node.requireNids ?? [],
    pids: (node.pids ?? []).map(
      (pid) => pdict[pid] ?? { docId: pid, title: String(pid) }
    ),
  }));
}
