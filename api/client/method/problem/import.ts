import { clientRequest } from '@/api/client';

export const PROBLEM_IMPORT_FORMATS = ['hydro', 'fps', 'hoj', 'qduoj'] as const;

export type ProblemImportFormat = (typeof PROBLEM_IMPORT_FORMATS)[number];

export type ImportProblemOptions = {
  file: File;
  preferredPrefix?: string;
  hidden?: boolean;
  keepUser?: boolean;
};

export const importProblems = (
  format: ProblemImportFormat,
  options: ImportProblemOptions
) => {
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
