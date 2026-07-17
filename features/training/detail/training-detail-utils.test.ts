import {
  getTrainingChapterAnchorId,
  getTrainingNodeStatusMeta,
  getTrainingProblemCount,
} from './training-detail-utils';
import type { TrainingNode, TrainingNodeStatus } from '@/shared/types/training';
import { describe, expect, it } from 'vitest';

describe('getTrainingProblemCount', () => {
  it('sums pids across nodes', () => {
    const dag: TrainingNode[] = [
      { _id: 1, title: 'A', requireNids: [], pids: [1, 2] },
      { _id: 2, title: 'B', requireNids: [1], pids: [3] },
      { _id: 3, title: 'C', requireNids: [], pids: [] },
    ];
    expect(getTrainingProblemCount(dag)).toBe(3);
  });

  it('returns 0 for empty dag', () => {
    expect(getTrainingProblemCount([])).toBe(0);
  });
});

describe('getTrainingChapterAnchorId', () => {
  it('builds a stable anchor id', () => {
    expect(getTrainingChapterAnchorId(12)).toBe('training-chapter-12');
  });
});

describe('getTrainingNodeStatusMeta', () => {
  it('returns completed meta when isDone', () => {
    const status: TrainingNodeStatus = {
      progress: 1,
      isDone: true,
      isProgress: false,
      isOpen: true,
      isInvalid: false,
    };
    expect(getTrainingNodeStatusMeta(status)).toEqual({
      text: '已完成',
      className:
        'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    });
  });

  it('returns in-progress meta when open and progressing', () => {
    const status: TrainingNodeStatus = {
      progress: 0.5,
      isDone: false,
      isProgress: true,
      isOpen: true,
      isInvalid: false,
    };
    expect(getTrainingNodeStatusMeta(status)).toEqual({
      text: '进行中',
      className: '',
    });
  });

  it('returns null when status is missing or not active', () => {
    expect(getTrainingNodeStatusMeta(undefined)).toBeNull();
    expect(
      getTrainingNodeStatusMeta({
        progress: 0,
        isDone: false,
        isProgress: false,
        isOpen: true,
        isInvalid: false,
      })
    ).toBeNull();
    expect(
      getTrainingNodeStatusMeta({
        progress: 0,
        isDone: false,
        isProgress: true,
        isOpen: false,
        isInvalid: false,
      })
    ).toBeNull();
  });
});
