import type { TrainingNode, TrainingNodeStatus } from '@/shared/types/training';

export function getTrainingProblemCount(dag: TrainingNode[]) {
  return dag.reduce((sum, node) => sum + node.pids.length, 0);
}

export function getTrainingChapterAnchorId(nodeId: number) {
  return `training-chapter-${nodeId}`;
}

export function getTrainingNodeStatusMeta(status?: TrainingNodeStatus) {
  if (status?.isDone) {
    return {
      text: '已完成',
      className:
        'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    };
  }

  if (status?.isOpen && status.isProgress) {
    return {
      text: '进行中',
      className: '',
    };
  }

  return null;
}
