import {
  convertLegacyRootCases,
  detectTestcasePairs,
  dumpProblemConfig,
  moveTestcases,
  naturalSort,
  normalizeSubtaskScores,
  parseMemoryMb,
  parseProblemConfigYaml,
  parseTimeMs,
  removeDeletedReferences,
  renameConfigReferences,
  sanitizeProblemConfig,
  selectSaveYaml,
  testcaseKey,
  validateProblemConfig,
} from './problem-config-utils';
import type { ProblemConfigFile } from '@/shared/types/problem-config';
import { describe, expect, it } from 'vitest';

describe('problem config YAML', () => {
  it('parses an empty file as a standard configuration', () => {
    expect(parseProblemConfigYaml('').config).toEqual({
      type: 'default',
      subtasks: [],
    });
  });

  it('reports schema paths and YAML syntax errors', () => {
    expect(parseProblemConfigYaml('type: missing').errors[0]).toMatchObject({
      path: '/type',
    });
    expect(parseProblemConfigYaml('type: [').errors[0].message).toBeTruthy();
    expect(
      validateProblemConfig({ type: 'default', unknown: true }).valid
    ).toBe(false);
  });

  it('converts legacy root cases into a scored subtask', () => {
    expect(
      convertLegacyRootCases({
        type: 'default',
        score: 20,
        cases: [
          { input: '1.in', output: '1.out' },
          { input: '2.in', output: '2.out' },
        ],
      })
    ).toMatchObject({
      subtasks: [{ id: 1, type: 'sum', score: 40 }],
    });
  });

  it('sanitizes every type-specific field without changing the parsed type', () => {
    const config: ProblemConfigFile = {
      type: 'default',
      subType: 'single',
      target: 'P1000',
      time: '1s',
      memory: '256MB',
      checker_type: 'strict',
      checker: 'checker.cc',
      interactor: 'interactor.cc',
      manager: 'manager.cc',
      multi_pass: 21,
      validator: { file: 'validator.cc', lang: 'cpp' },
      user_extra_files: ['asset.txt'],
      judge_extra_files: ['judge.txt'],
      subtasks: [
        {
          id: 1,
          type: 'sum',
          score: 100,
          cases: [
            {
              input: '1.in',
              output: '1.out',
              time: '2s',
              memory: '512MB',
              score: 100,
            },
          ],
        },
      ],
    };
    const sanitized = sanitizeProblemConfig(config);
    expect(sanitized).toMatchObject({
      type: 'default',
      target: 'P1000',
      checker_type: 'strict',
      manager: 'manager.cc',
      validator: { file: 'validator.cc', lang: 'cpp' },
      subtasks: [{ cases: [{ score: 100 }] }],
    });
    expect(sanitized).not.toHaveProperty('subType');
    expect(sanitized).not.toHaveProperty('checker');
    expect(sanitized).not.toHaveProperty('interactor');
    expect(sanitized).not.toHaveProperty('multi_pass');

    expect(
      sanitizeProblemConfig({
        ...config,
        type: 'interactive',
        interactor: 'interactor.cc',
        checker_type: 'testlib',
        checker: 'checker.cc',
        multi_pass: 2,
      })
    ).toMatchObject({
      type: 'interactive',
      interactor: 'interactor.cc',
      multi_pass: 2,
    });
  });

  it('keeps submit-answer checker state in the form but omits it from YAML', () => {
    const config: ProblemConfigFile = {
      type: 'submit_answer',
      subType: 'multi',
      checker_type: 'testlib',
      checker: 'checker.cc',
    };
    expect(sanitizeProblemConfig(config)).toEqual({
      type: 'submit_answer',
      subType: 'multi',
    });
    expect(dumpProblemConfig(config)).not.toContain('checker');
  });

  it('retains only type and answers for objective problems', () => {
    expect(
      sanitizeProblemConfig({
        type: 'objective',
        time: '1s',
        answers: { '1': ['A', 10] },
      })
    ).toEqual({ type: 'objective', answers: { '1': ['A', 10] } });
  });

  it('selects sanitized YAML for valid saves and exact editor text for invalid saves', () => {
    const raw = 'type: [\n';
    expect(selectSaveYaml(false, raw, { type: 'default' })).toBe(raw);
    expect(selectSaveYaml(true, raw, { type: 'default' })).toBe(
      'type: default\n'
    );
  });
});

describe('testcase configuration helpers', () => {
  it('naturally sorts filenames and detects supported input/output patterns', () => {
    expect(naturalSort(['10.in', '2.in', '1.in'], (name) => name)).toEqual([
      '1.in',
      '2.in',
      '10.in',
    ]);
    const subtasks = detectTestcasePairs([
      '1.in',
      '1.ans',
      '2.in',
      '2.out',
      '3-1.in',
      '3-1.out',
      'sample.in2',
      'sample.out2',
    ]);
    expect(subtasks.flatMap((subtask) => subtask.cases)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ input: '1.in', output: '1.ans' }),
        expect.objectContaining({ input: '2.in', output: '2.out' }),
        expect.objectContaining({ input: '3-1.in', output: '3-1.out' }),
        expect.objectContaining({ input: 'sample.in2', output: 'sample.out2' }),
      ])
    );
  });

  it('retains an existing subtask with id zero', () => {
    const subtasks = detectTestcasePairs([], {
      subtasks: [{ id: 0, score: 100, cases: [] }],
    });

    expect(subtasks).toEqual([{ id: 0, score: 100, cases: [] }]);
  });

  it('normalizes subtask scores to exactly 100', () => {
    expect(normalizeSubtaskScores([{ id: 1 }, { id: 2 }])).toEqual([
      { id: 1, score: 50 },
      { id: 2, score: 50 },
    ]);
    expect(
      normalizeSubtaskScores([{ score: 80 }, { score: 80 }]).reduce(
        (sum, subtask) => sum + (subtask.score ?? 0),
        0
      )
    ).toBe(100);
    expect(
      normalizeSubtaskScores([{ score: 20 }, { score: 20 }]).reduce(
        (sum, subtask) => sum + (subtask.score ?? 0),
        0
      )
    ).toBe(100);
  });

  it('terminates when more than 100 subtasks are already at minimum score', () => {
    const subtasks = Array.from({ length: 101 }, (_, id) => ({ id, score: 1 }));

    const normalized = normalizeSubtaskScores(subtasks);

    expect(normalized).toHaveLength(101);
    expect(normalized.every((subtask) => subtask.score === 1)).toBe(true);
  });

  it('parses inherited time and memory units', () => {
    expect(parseTimeMs('1.5s')).toBe(1500);
    expect(parseTimeMs('500ms')).toBe(500);
    expect(parseMemoryMb('1GB')).toBe(1024);
    expect(parseMemoryMb('1024k')).toBe(1);
  });

  it('cascades file renames through sources, extras, and testcase references', () => {
    const renamed = renameConfigReferences(
      {
        checker: { file: 'old.cpp', lang: 'cpp' },
        user_extra_files: ['old.cpp'],
        subtasks: [
          {
            score: 100,
            cases: [{ input: 'old.cpp', output: 'old.out', time: '2s' }],
          },
        ],
      },
      'old.cpp',
      'new.cpp'
    );
    expect(renamed).toMatchObject({
      checker: { file: 'new.cpp', lang: 'cpp' },
      user_extra_files: ['new.cpp'],
      subtasks: [{ cases: [{ input: 'new.cpp', time: '2s' }] }],
    });
  });

  it('clears deleted sources and removes assigned and unassigned cases', () => {
    const result = removeDeletedReferences(
      {
        checker: 'checker.cpp',
        judge_extra_files: ['checker.cpp', 'keep.txt'],
        subtasks: [
          {
            score: 100,
            cases: [
              { input: '1.in', output: '1.out' },
              { input: '2.in', output: '2.out' },
            ],
          },
        ],
      },
      [{ input: '3.in', output: '3.out' }],
      ['checker.cpp', '1.out', '3.in']
    );
    expect(result.config).not.toHaveProperty('checker');
    expect(result.config.judge_extra_files).toEqual(['keep.txt']);
    expect(result.config.subtasks?.[0].cases).toEqual([
      { input: '2.in', output: '2.out' },
    ]);
    expect(result.unassigned).toEqual([]);
  });

  it('moves multiple cases with overrides and prevents destination duplicates', () => {
    const overridden = {
      input: '1.in',
      output: '1.out',
      time: '2s',
    };
    const result = moveTestcases(
      {
        subtasks: [
          { id: 1, score: 50, cases: [overridden] },
          { id: 2, score: 50, cases: [{ input: '1.in', output: '1.out' }] },
        ],
      },
      [],
      1,
      2,
      [testcaseKey(overridden)]
    );
    expect(result.config.subtasks?.[0].cases).toEqual([]);
    expect(result.config.subtasks?.[1].cases).toHaveLength(1);
  });
});
