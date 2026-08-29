import {
  canRunScratchpadPretest,
  formatScratchpadPretestOutput,
  getScratchpadDraftId,
  mergeScratchpadRecords,
  resolveScratchpadLanguage,
} from '@/features/problem/scratchpad/scratchpad-utils';
import { describe, expect, it } from 'vitest';

const languages = {
  cc: {
    display: 'C++',
    versions: [
      { name: 'cc.cc14o2', display: 'C++ 14' },
      { name: 'cc.cc17o2', display: 'C++ 17' },
    ],
  },
  py: {
    display: 'Python',
    versions: [{ name: 'py.py3', display: 'Python 3' }],
  },
};

describe('scratchpad utilities', () => {
  it('uses a valid draft language before the user preference', () => {
    expect(resolveScratchpadLanguage(languages, 'py.py3', 'cc.cc17o2')).toBe(
      'py.py3'
    );
  });

  it('falls back to the preferred language family and then the first option', () => {
    expect(resolveScratchpadLanguage(languages, 'missing', 'cc.old')).toBe(
      'cc.cc14o2'
    );
    expect(resolveScratchpadLanguage(languages, 'missing', 'go')).toBe(
      'cc.cc14o2'
    );
  });

  it('isolates drafts by user, problem, domain, and event', () => {
    expect(
      getScratchpadDraftId({
        userId: 2,
        domainId: 'system',
        problemDocId: 10,
        eventKind: 'contest',
        tid: 'contest',
      })
    ).toBe('[2,"system",10,"contest","contest"]');
  });

  it('merges record updates, prepends new records, and excludes pretests', () => {
    const merged = mergeScratchpadRecords(
      [{ _id: 'a', status: 0 }],
      [
        { _id: 'a', status: 1 },
        { _id: 'b', status: 2 },
        { _id: 'p', contest: '000000000000000000000000', status: 1 },
      ]
    );
    expect(merged.map((record) => record._id)).toEqual(['b', 'a']);
    expect(merged[1]?.status).toBe(1);
  });

  it('formats pretest status, resources, compiler output, and testcase output', () => {
    expect(
      formatScratchpadPretestOutput(
        {
          _id: 'p',
          time: 12,
          memory: 2048,
          compilerTexts: ['compiler'],
          testCases: [
            {
              id: 1,
              subtaskId: 1,
              score: 0,
              time: 12,
              memory: 2048,
              status: 2,
              message: { message: 'Expected {0}', params: ['42'] },
            },
          ],
        },
        'Wrong Answer'
      )
    ).toBe('Wrong Answer 12ms 2048KiB\ncompiler\nExpected 42');
  });

  it('respects remote-judge language pretest capabilities', () => {
    expect(
      canRunScratchpadPretest('remote_judge', {
        familyKey: 'remote',
        familyDisplay: 'Remote',
        name: 'remote.a',
        display: 'A',
        pretest: 'judgeclient.0',
      })
    ).toBe(true);
    expect(
      canRunScratchpadPretest('remote_judge', {
        familyKey: 'remote',
        familyDisplay: 'Remote',
        name: 'remote.b',
        display: 'B',
        pretest: false,
        validAs: 'remote.a',
      })
    ).toBe(false);
    expect(
      canRunScratchpadPretest('remote_judge', {
        familyKey: 'remote',
        familyDisplay: 'Remote',
        name: 'remote.c',
        display: 'C',
        validAs: 'remote.a',
        hidden: false,
      })
    ).toBe(true);
  });
});
