import { problemConfigSchema } from './problem-config-schema';
import type {
  CompilableSource,
  ProblemConfigFile,
  ProblemConfigValidationError,
  ProblemSubtask,
  ProblemTestCase,
} from '@/shared/types/problem-config';
import Ajv from 'ajv';
import { dump, load } from 'js-yaml';

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(problemConfigSchema);
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

export const DEFAULT_PROBLEM_CONFIG: ProblemConfigFile = {
  type: 'default',
  subtasks: [],
};

const configKeys: Array<keyof ProblemConfigFile> = [
  'type',
  'subType',
  'target',
  'score',
  'time',
  'memory',
  'filename',
  'checker_type',
  'checker',
  'interactor',
  'manager',
  'num_processes',
  'multi_pass',
  'validator',
  'user_extra_files',
  'judge_extra_files',
  'detail',
  'redirect',
  'cases',
  'subtasks',
  'langs',
  'key',
  'time_limit_rate',
  'memory_limit_rate',
];

const cloneConfig = (config: ProblemConfigFile): ProblemConfigFile =>
  structuredClone(config);

function withSubtaskIds(config: ProblemConfigFile) {
  const next = cloneConfig(config);
  const used = new Set(
    (next.subtasks ?? [])
      .map((subtask) => subtask.id)
      .filter((id): id is number => typeof id === 'number')
  );
  for (const subtask of next.subtasks ?? []) {
    if (typeof subtask.id === 'number') continue;
    let id = 1;
    while (used.has(id)) id += 1;
    subtask.id = id;
    used.add(id);
  }
  return next;
}

export function convertLegacyRootCases(config: ProblemConfigFile) {
  if (!config.cases?.length) return config;
  const next = cloneConfig(config);
  const score = (next.score ?? 0) * next.cases!.length;
  next.subtasks = [
    {
      id: 1,
      type: 'sum',
      score: score > 0 && score < 100 ? score : 100,
      cases: next.cases,
    },
  ];
  delete next.cases;
  delete next.score;
  return next;
}

export function validateProblemConfig(config: unknown): {
  valid: boolean;
  errors: ProblemConfigValidationError[];
} {
  const valid = validate(config);
  return {
    valid,
    errors: valid
      ? []
      : (validate.errors ?? []).map((error) => ({
          path: error.instancePath || '/',
          message: error.message ?? 'Invalid value',
        })),
  };
}

export function parseProblemConfigYaml(raw: string): {
  config?: ProblemConfigFile;
  errors: ProblemConfigValidationError[];
} {
  try {
    const parsed = raw.trim() ? load(raw) : cloneConfig(DEFAULT_PROBLEM_CONFIG);
    const value =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as ProblemConfigFile)
        : cloneConfig(DEFAULT_PROBLEM_CONFIG);
    const validation = validateProblemConfig(value);
    if (!validation.valid) return { errors: validation.errors };
    return {
      config: withSubtaskIds(convertLegacyRootCases(value)),
      errors: [],
    };
  } catch (error) {
    return {
      errors: [
        {
          path: '/',
          message: error instanceof Error ? error.message : 'Invalid YAML',
        },
      ],
    };
  }
}

function sanitizeCase(testcase: ProblemTestCase): ProblemTestCase {
  return Object.fromEntries(
    ['time', 'memory', 'input', 'output', 'score']
      .filter((key) => testcase[key as keyof ProblemTestCase] !== undefined)
      .map((key) => [key, testcase[key as keyof ProblemTestCase]])
  ) as ProblemTestCase;
}

function sanitizeSubtask(subtask: ProblemSubtask): ProblemSubtask {
  const result = Object.fromEntries(
    ['time', 'memory', 'score', 'if', 'id', 'type']
      .filter((key) => subtask[key as keyof ProblemSubtask] !== undefined)
      .map((key) => [key, subtask[key as keyof ProblemSubtask]])
  ) as ProblemSubtask;
  if (subtask.cases !== undefined)
    result.cases = subtask.cases.map(sanitizeCase);
  return result;
}

export function sanitizeProblemConfig(config: ProblemConfigFile) {
  const result: ProblemConfigFile = {};
  for (const key of configKeys) {
    if (config[key] === undefined) continue;
    if (
      key === 'subType' &&
      ['single', 'multi'].includes(config.subType ?? '') &&
      config.type !== 'submit_answer'
    )
      continue;
    if (key === 'checker_type' && config.type !== 'default') continue;
    if (
      key === 'checker' &&
      (!result.checker_type ||
        ['default', 'strict'].includes(result.checker_type))
    )
      continue;
    if (key === 'interactor' && config.type !== 'interactive') continue;
    if (
      key === 'multi_pass' &&
      (!Number.isInteger(config.multi_pass) ||
        config.multi_pass! < 2 ||
        config.multi_pass! > 20)
    )
      continue;
    if (key === 'subtasks') {
      result.subtasks = (config.subtasks ?? []).map(sanitizeSubtask);
      continue;
    }
    if (key === 'cases') {
      result.cases = (config.cases ?? []).map(sanitizeCase);
      continue;
    }
    Object.assign(result, { [key]: config[key] });
  }
  if (result.type === 'objective') {
    return {
      type: 'objective' as const,
      answers: config.answers ?? {},
    };
  }
  return result;
}

export const dumpProblemConfig = (config: ProblemConfigFile) =>
  dump(sanitizeProblemConfig(config), {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
    seqNoIndent: true,
  });

export function parseTimeMs(value: string | number = '1s') {
  if (typeof value === 'number' || Number.isSafeInteger(Number(value)))
    return Number(value);
  const match = /^([0-9]+(?:\.[0-9]*)?)([mu]?)s?$/i.exec(value);
  if (!match) return 1000;
  const units = { '': 1000, m: 1, u: 0.001 } as const;
  return Math.floor(
    Number.parseFloat(match[1]) *
      units[match[2].toLowerCase() as keyof typeof units]
  );
}

export function parseMemoryMb(value: string | number = '256m') {
  if (typeof value === 'number' || Number.isSafeInteger(Number(value)))
    return Number(value);
  const match = /^([0-9]+(?:\.[0-9]*)?)([kmg])b?$/i.exec(value);
  if (!match) return 256;
  const units = { k: 1 / 1024, m: 1, g: 1024 } as const;
  return Math.ceil(
    Number.parseFloat(match[1]) *
      units[match[2].toLowerCase() as keyof typeof units]
  );
}

export const naturalSort = <T>(items: T[], key: (item: T) => string) =>
  [...items].sort((a, b) => collator.compare(key(a), key(b)));

type MatchRule = {
  regex: RegExp;
  output: (match: RegExpExecArray) => string[];
  id: (match: RegExpExecArray) => number;
  subtask: (match: RegExpExecArray) => number;
  type: (match: RegExpExecArray) => 'min' | 'max' | 'sum';
};

const matchRules: MatchRule[] = [
  {
    regex: /^(([\w.-]*?)(?:(\d*)[-_])?(\d+))\.(in|IN|txt|TXT|in\.txt|IN\.TXT)$/,
    output: (match) =>
      ['out', 'ans']
        .flatMap((extension) => [
          extension,
          extension.toUpperCase(),
          `${extension}.txt`,
          `${extension.toUpperCase()}.TXT`,
        ])
        .flatMap((extension) => [
          `${match[1]}.${extension}`,
          `${match[1]}.${extension}`
            .replace(/input/g, 'output')
            .replace(/INPUT/g, 'OUTPUT'),
        ])
        .concat(
          match[1].includes('input')
            ? `${match[1]}.txt`.replace(/input/g, 'output')
            : []
        ),
    id: (match) => Number(match[4]),
    subtask: (match) => Number(match[3] || 1),
    type: (match) => (match[3] ? 'min' : 'sum'),
  },
  {
    regex: /^(\D*)\.(in|IN)(\d+)$/,
    output: (match) =>
      [
        `${match[1]}.${match[2] === 'in' ? 'ou' : 'OU'}${match[3]}`,
        `${match[1]}.${match[2] === 'in' ? 'out' : 'OUT'}${match[3]}`,
      ].flatMap((name) => [
        name,
        name.replace(/input/g, 'output').replace(/INPUT/g, 'OUTPUT'),
      ]),
    id: (match) => Number(match[3]),
    subtask: () => 1,
    type: () => 'sum',
  },
  {
    regex: /^(\D*)([0-9]+)([-_])([0-9]+)\.(in|IN)$/,
    output: (match) =>
      ['out', 'ans', 'OUT', 'ANS'].map(
        (extension) =>
          `${match[1]}${match[2]}${match[3]}${match[4]}.${extension}`
      ),
    id: (match) => Number(match[4]),
    subtask: (match) => Number(match[2]),
    type: () => 'min',
  },
  {
    regex: /^(([0-9]+)[-_].*)\.(in|IN)$/,
    output: (match) =>
      ['out', 'ans', 'OUT', 'ANS'].map(
        (extension) => `${match[1]}.${extension}`
      ),
    id: (match) => Number(match[2]),
    subtask: () => 1,
    type: () => 'sum',
  },
];

export function detectTestcasePairs(
  filenames: string[],
  config: ProblemConfigFile = {}
) {
  const names = new Set(filenames);
  const subtasks = new Map<number, ProblemSubtask>();
  for (const existing of config.subtasks ?? []) {
    if (typeof existing.id === 'number')
      subtasks.set(
        existing.id,
        cloneConfig({ subtasks: [existing] }).subtasks![0]
      );
  }
  for (const filename of filenames) {
    for (const rule of matchRules) {
      const match = rule.regex.exec(filename);
      if (!match) continue;
      const output = rule
        .output(match)
        .find((candidate) => names.has(candidate));
      if (!output) continue;
      const id = rule.subtask(match);
      const testcase = { input: filename, output };
      const subtask = subtasks.get(id) ?? {
        id,
        type: rule.type(match),
        cases: [],
      };
      if (
        !subtask.cases?.some(
          (item) =>
            item.input === testcase.input && item.output === testcase.output
        )
      )
        subtask.cases = [...(subtask.cases ?? []), testcase];
      subtasks.set(id, subtask);
      break;
    }
  }
  return naturalSort([...subtasks.values()], (subtask) => String(subtask.id));
}

function distribute(total: number, count: number) {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  const extra = total % count;
  return Array.from({ length: count }, (_, index) =>
    index >= count - extra ? base + 1 : base
  );
}

export function normalizeSubtaskScores(subtasks: ProblemSubtask[]) {
  if (!subtasks.length) return [];
  const explicit = subtasks.reduce(
    (sum, subtask) => sum + Math.max(0, subtask.score ?? 0),
    0
  );
  const missingIndexes = subtasks
    .map((subtask, index) => (subtask.score ? -1 : index))
    .filter((index) => index >= 0);
  const next = subtasks.map((subtask) => ({ ...subtask }));
  const remaining = 100 - explicit;
  if (missingIndexes.length && remaining >= missingIndexes.length) {
    const assigned = distribute(remaining, missingIndexes.length);
    missingIndexes.forEach((index, offset) => {
      next[index].score = assigned[offset];
    });
    return next;
  }

  const weights = next.map((subtask) => Math.max(1, subtask.score ?? 1));
  const totalWeight = weights.reduce((sum, score) => sum + score, 0);
  const exact = weights.map((score) => (score / totalWeight) * 100);
  const scores = exact.map((score) => Math.max(1, Math.floor(score)));
  let delta = 100 - scores.reduce((sum, score) => sum + score, 0);
  const order = exact
    .map((score, index) => ({ index, fraction: score - Math.floor(score) }))
    .sort((a, b) => b.fraction - a.fraction);
  let cursor = 0;
  while (delta !== 0) {
    if (delta < 0 && scores.every((score) => score === 1)) break;
    const index = order[cursor % order.length].index;
    if (delta > 0) {
      scores[index] += 1;
      delta -= 1;
    } else if (scores[index] > 1) {
      scores[index] -= 1;
      delta += 1;
    }
    cursor += 1;
  }
  next.forEach((subtask, index) => {
    subtask.score = scores[index];
  });
  return next;
}

export const testcaseKey = (testcase: ProblemTestCase) =>
  `${testcase.input}\u0000${testcase.output ?? ''}`;

function renameSource(
  source: CompilableSource | undefined,
  oldName: string,
  newName: string
) {
  if (typeof source === 'string') return source === oldName ? newName : source;
  if (source?.file === oldName) return { ...source, file: newName };
  return source;
}

export function renameConfigReferences(
  config: ProblemConfigFile,
  oldName: string,
  newName: string
) {
  const next = cloneConfig(config);
  for (const key of ['checker', 'interactor', 'manager', 'validator'] as const)
    next[key] = renameSource(next[key], oldName, newName);
  for (const key of ['user_extra_files', 'judge_extra_files'] as const)
    next[key] = next[key]?.map((name) => (name === oldName ? newName : name));
  const renameCase = (testcase: ProblemTestCase) => ({
    ...testcase,
    input: testcase.input === oldName ? newName : testcase.input,
    output: testcase.output === oldName ? newName : testcase.output,
  });
  next.cases = next.cases?.map(renameCase);
  next.subtasks = next.subtasks?.map((subtask) => ({
    ...subtask,
    cases: subtask.cases?.map(renameCase),
  }));
  return next;
}

export function removeDeletedReferences(
  config: ProblemConfigFile,
  unassigned: ProblemTestCase[],
  filenames: string[]
) {
  const removed = new Set(filenames);
  const next = cloneConfig(config);
  for (const key of [
    'checker',
    'interactor',
    'manager',
    'validator',
  ] as const) {
    const source = next[key];
    const name = typeof source === 'string' ? source : source?.file;
    if (name && removed.has(name)) delete next[key];
  }
  for (const key of ['user_extra_files', 'judge_extra_files'] as const)
    next[key] = next[key]?.filter((name) => !removed.has(name));
  const keep = (testcase: ProblemTestCase) =>
    !removed.has(testcase.input) &&
    (!testcase.output || !removed.has(testcase.output));
  next.cases = next.cases?.filter(keep);
  next.subtasks = next.subtasks?.map((subtask) => ({
    ...subtask,
    cases: subtask.cases?.filter(keep),
  }));
  return { config: next, unassigned: unassigned.filter(keep) };
}

export function moveTestcases(
  config: ProblemConfigFile,
  unassigned: ProblemTestCase[],
  sourceId: number | null,
  targetId: number | null,
  keys: string[]
) {
  if (sourceId === targetId) return { config, unassigned };
  const wanted = new Set(keys);
  const next = cloneConfig(config);
  let source =
    sourceId === null
      ? [...unassigned]
      : [
          ...(next.subtasks?.find((subtask) => subtask.id === sourceId)
            ?.cases ?? []),
        ];
  const moving = source.filter((testcase) => wanted.has(testcaseKey(testcase)));
  source = source.filter((testcase) => !wanted.has(testcaseKey(testcase)));
  let nextUnassigned = sourceId === null ? source : [...unassigned];
  if (sourceId !== null) {
    const sourceSubtask = next.subtasks?.find(
      (subtask) => subtask.id === sourceId
    );
    if (sourceSubtask) sourceSubtask.cases = source;
  }
  if (targetId === null) {
    const existing = new Set(nextUnassigned.map(testcaseKey));
    nextUnassigned = naturalSort(
      [
        ...nextUnassigned,
        ...moving.filter((item) => !existing.has(testcaseKey(item))),
      ],
      (item) => item.input
    );
  } else {
    const target = next.subtasks?.find((subtask) => subtask.id === targetId);
    if (target) {
      const existing = new Set((target.cases ?? []).map(testcaseKey));
      target.cases = naturalSort(
        [
          ...(target.cases ?? []),
          ...moving.filter((item) => !existing.has(testcaseKey(item))),
        ],
        (item) => item.input
      );
    }
  }
  return { config: next, unassigned: nextUnassigned };
}

export const selectSaveYaml = (
  valid: boolean,
  raw: string,
  config: ProblemConfigFile
) => (valid ? dumpProblemConfig(config) : raw);
