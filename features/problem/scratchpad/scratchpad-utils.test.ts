import type { ScratchpadRecord } from './scratchpad-types';
import {
  canRunScratchpadPretest,
  createOptimisticScratchpadRecord,
  formatScratchpadPretestOutput,
  getScratchpadDraftId,
  mergeScratchpadRecords,
  parseScratchpadRecordMessage,
  parseScratchpadRecords,
  resolveScratchpadLanguage,
  toScratchpadRecord,
} from '@/features/problem/scratchpad/scratchpad-utils';
import { STATUS } from '@/shared/configs/status';
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

function makeRecord(
  overrides: Partial<ScratchpadRecord> & Pick<ScratchpadRecord, '_id'>
): ScratchpadRecord {
  return {
    domainId: 'system',
    pid: 1,
    uid: 2,
    lang: 'cc.cc17o2',
    score: 0,
    memory: 0,
    time: 0,
    status: STATUS.STATUS_WAITING,
    compilerTexts: [],
    testCases: [],
    ...overrides,
  };
}

describe('scratchpad utilities', () => {
  it('uses a valid draft language before the user preference', () => {
    expect(resolveScratchpadLanguage(languages, 'py.py3', 'cc.cc17o2')).toBe(
      'py.py3'
    );
  });

  it('uses C++ 14 as the default language for a new scratchpad', () => {
    expect(resolveScratchpadLanguage(languages, undefined, 'py.py3')).toBe(
      'cc.cc14o2'
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

  it('keeps only records that match the scratchpad projection', () => {
    expect(toScratchpadRecord({ _id: 'a', status: 1 })).toBeNull();
    expect(
      toScratchpadRecord({
        _id: 'a',
        domainId: 'system',
        pid: 1,
        uid: 2,
        lang: 'cc.cc17o2',
        score: 100,
        memory: 256,
        time: 12,
        status: 1,
        progress: 40,
        contest: 'contest-id',
        compilerTexts: ['ok'],
        testCases: [{ message: 'stdout' }],
      })
    ).toEqual({
      _id: 'a',
      domainId: 'system',
      pid: 1,
      uid: 2,
      lang: 'cc.cc17o2',
      score: 100,
      memory: 256,
      time: 12,
      status: 1,
      progress: 40,
      contest: 'contest-id',
      compilerTexts: ['ok'],
      testCases: [{ message: 'stdout' }],
    });
  });

  it('normalizes list, socket, and optimistic records at their boundaries', () => {
    expect(
      parseScratchpadRecords([
        {
          _id: 'a',
          domainId: 'system',
          pid: 1,
          uid: 2,
          lang: 'cc.cc17o2',
          score: 0,
          memory: 0,
          time: 0,
          status: 0,
        },
        { _id: 'skipped' },
      ])
    ).toEqual([makeRecord({ _id: 'a' })]);
    expect(
      parseScratchpadRecordMessage({
        rdoc: {
          _id: 'p',
          domainId: 'system',
          pid: 1,
          uid: 2,
          lang: 'cc.cc17o2',
          score: 0,
          memory: 1024,
          time: 5,
          status: 1,
          contest: '000000000000000000000000',
        },
      })
    ).toEqual(
      makeRecord({
        _id: 'p',
        memory: 1024,
        time: 5,
        status: 1,
        contest: '000000000000000000000000',
      })
    );
    expect(
      createOptimisticScratchpadRecord({
        id: 'optimistic',
        domainId: 'system',
        pid: 1,
        uid: 2,
        lang: 'cc.cc17o2',
        contest: 'contest-id',
      })
    ).toEqual(
      makeRecord({
        _id: 'optimistic',
        contest: 'contest-id',
      })
    );
  });

  it('merges record updates, prepends new records, and excludes pretests', () => {
    const merged = mergeScratchpadRecords(
      [makeRecord({ _id: 'a', status: 0 })],
      [
        makeRecord({ _id: 'a', status: 1 }),
        makeRecord({ _id: 'b', status: 2 }),
        makeRecord({
          _id: 'p',
          contest: '000000000000000000000000',
          status: 1,
        }),
      ]
    );
    expect(merged.map((record) => record._id)).toEqual(['b', 'a']);
    expect(merged[1]?.status).toBe(1);
  });

  it('formats pretest status, resources, compiler output, and testcase output', () => {
    expect(
      formatScratchpadPretestOutput(
        makeRecord({
          _id: 'p',
          time: 12,
          memory: 2048,
          compilerTexts: ['compiler'],
          testCases: [
            {
              message: { message: 'Expected {0}', params: ['42'] },
            },
          ],
        }),
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
