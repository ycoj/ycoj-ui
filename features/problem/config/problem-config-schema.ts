import { testlibCheckers } from './problem-config-utils.constants';

export const problemConfigSchema = {
  type: 'object',
  definitions: {
    cases: { type: 'array', items: { $ref: '#/definitions/case' } },
    case: {
      type: 'object',
      properties: {
        input: { type: 'string' },
        output: { type: 'string' },
        time: { $ref: '#/definitions/time' },
        memory: { $ref: '#/definitions/memory' },
        score: { $ref: '#/definitions/score' },
      },
      required: ['input'],
      additionalProperties: false,
    },
    subtask: {
      type: 'object',
      properties: {
        type: { enum: ['min', 'max', 'sum'] },
        time: { $ref: '#/definitions/time' },
        memory: { $ref: '#/definitions/memory' },
        score: { $ref: '#/definitions/score' },
        cases: { $ref: '#/definitions/cases' },
        if: { type: 'array', items: { type: 'integer' } },
        id: { type: 'integer' },
      },
      required: ['score'],
      additionalProperties: false,
    },
    time: {
      type: 'string',
      pattern: '^([1-9][0-9]*(?:\\.[0-9]+)?|0\\.[0-9]*[1-9][0-9]*)([mu]?)s?$',
    },
    memory: {
      type: 'string',
      pattern:
        '^([1-9][0-9]*(?:\\.[0-9]+)?|0\\.[0-9]*[1-9][0-9]*)([kKmMgG])[bB]?$',
    },
    score: { type: 'integer', maximum: 100, minimum: 1 },
    rateConfig: {
      type: 'object',
      patternProperties: { '^.+$': { type: 'number' } },
    },
    compilableFile: {
      oneOf: [
        { type: 'string', pattern: '\\.' },
        {
          type: 'object',
          properties: {
            file: { type: 'string', pattern: '\\.' },
            lang: { type: 'string' },
          },
          required: ['file', 'lang'],
          additionalProperties: false,
        },
      ],
    },
  },
  properties: {
    redirect: { type: 'string', pattern: '[0-9a-zA-Z_-]+\\/[0-9]+' },
    key: { type: 'string', pattern: '[0-9a-f]{32}' },
    type: {
      enum: [
        'default',
        'interactive',
        'communication',
        'submit_answer',
        'objective',
        'remote_judge',
      ],
    },
    subType: { type: 'string' },
    langs: { type: 'array', items: { type: 'string' } },
    target: { type: 'string' },
    checker_type: {
      enum: [
        'default',
        'lemon',
        'syzoj',
        'hustoj',
        'testlib',
        'strict',
        'qduoj',
        'kattis',
      ],
    },
    checker: {
      oneOf: [
        { type: 'string', enum: testlibCheckers },
        { $ref: '#/definitions/compilableFile' },
      ],
    },
    interactor: { $ref: '#/definitions/compilableFile' },
    manager: { $ref: '#/definitions/compilableFile' },
    validator: { $ref: '#/definitions/compilableFile' },
    num_processes: { type: 'integer', maximum: 5, minimum: 1 },
    multi_pass: { type: 'integer', maximum: 20, minimum: 2 },
    user_extra_files: { type: 'array', items: { type: 'string' } },
    judge_extra_files: { type: 'array', items: { type: 'string' } },
    cases: { $ref: '#/definitions/cases' },
    subtasks: { type: 'array', items: { $ref: '#/definitions/subtask' } },
    filename: { type: 'string' },
    detail: {
      oneOf: [{ enum: ['full', 'case', 'none'] }, { type: 'boolean' }],
    },
    time: { $ref: '#/definitions/time' },
    memory: { $ref: '#/definitions/memory' },
    score: { $ref: '#/definitions/score' },
    answers: {
      type: 'object',
      patternProperties: {
        '^\\d+(-\\d+)?$': {
          type: 'array',
          minItems: 2,
          maxItems: 2,
        },
      },
      additionalProperties: false,
    },
    time_limit_rate: { $ref: '#/definitions/rateConfig' },
    memory_limit_rate: { $ref: '#/definitions/rateConfig' },
  },
  additionalProperties: false,
} as const;
