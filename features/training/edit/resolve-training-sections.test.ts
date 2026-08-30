import { resolveTrainingSections } from './resolve-training-sections';
import type { ProblemDict } from '@/shared/types/problem';
import type { TrainingNode } from '@/shared/types/training';
import { describe, expect, it } from 'vitest';

const dag: TrainingNode[] = [
  {
    _id: 1,
    title: 'Intro',
    requireNids: [],
    pids: [1000],
  },
];

describe('resolveTrainingSections', () => {
  it('copies title and display pid when pdict docId matches the DAG pid', () => {
    const pdict = {
      1000: { docId: 1000, pid: 'P1000', title: 'A+B Problem' },
    } as unknown as ProblemDict;

    expect(resolveTrainingSections(dag, pdict)).toEqual([
      {
        id: 1,
        title: 'Intro',
        requireNids: [],
        pids: [{ docId: 1000, pid: 'P1000', title: 'A+B Problem' }],
      },
    ]);
  });

  it('falls back to the DAG pid when pdict has no entry', () => {
    expect(resolveTrainingSections(dag, {} as ProblemDict)).toEqual([
      {
        id: 1,
        title: 'Intro',
        requireNids: [],
        pids: [{ docId: 1000, title: '1000' }],
      },
    ]);
  });

  it('ignores YCOJ missing-problem stubs with docId 0', () => {
    const pdict = {
      1000: { docId: 0, title: '*', pid: '1000' },
    } as unknown as ProblemDict;

    expect(resolveTrainingSections(dag, pdict)[0]?.pids).toEqual([
      { docId: 1000, title: '1000' },
    ]);
  });
});
