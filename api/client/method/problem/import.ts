import { clientRequest } from '@/api/client';

export const PROBLEM_IMPORT_FORMATS = [
  'hydro',
  'fps',
  'hoj',
  'qduoj',
  'lvj',
] as const;

export type ProblemImportFormat = (typeof PROBLEM_IMPORT_FORMATS)[number];

export type ImportProblemOptions = {
  file: File;
  preferredPrefix?: string;
  hidden?: boolean;
  keepUser?: boolean;
};

export type LvjImportOptions = {
  oj: string;
  pid: string;
};

type ImportProblemsArgs =
  | [format: 'lvj', options: LvjImportOptions]
  | [
      format: Exclude<ProblemImportFormat, 'lvj'>,
      options: ImportProblemOptions,
    ];

export const importProblems = (...args: ImportProblemsArgs) => {
  const [format, options] = args;

  if (format === 'lvj') {
    return clientRequest.Post('/problem/import/zshfoj', options);
  }

  if (!('file' in options)) {
    throw new Error('A problem-set file is required for this import format.');
  }
  const formData = new FormData();
  formData.append('file', options.file);

  if (format === 'hydro') {
    if (options.preferredPrefix) {
      formData.append('preferredPrefix', options.preferredPrefix);
    }
    formData.append('hidden', String(!!options.hidden));
    formData.append('keepUser', String(!!options.keepUser));
  }

  return clientRequest.Post(`/problem/import/${format}`, formData);
};
