import { resolveProblemListItems } from '@/features/problem/resolve-problem-list-items';
import type { TrainingSectionValue } from '@/features/training/form/training-form-utils';
import type { TrainingNode } from '@/shared/types/training';
import 'server-only';

export async function resolveTrainingSections(
  dag: TrainingNode[]
): Promise<TrainingSectionValue[]> {
  return Promise.all(
    dag.map(async (node) => ({
      id: node._id,
      title: node.title,
      requireNids: node.requireNids ?? [],
      pids: await resolveProblemListItems((node.pids ?? []).join(',')),
    }))
  );
}
