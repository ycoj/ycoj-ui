import type { FileInfo } from './file';
import type { ProblemFilesHandlerData } from './problem-file';

export type ProblemType =
  | 'default'
  | 'interactive'
  | 'communication'
  | 'submit_answer'
  | 'objective'
  | 'remote_judge';

export type ProblemCheckerType =
  | 'default'
  | 'strict'
  | 'testlib'
  | 'lemon'
  | 'syzoj'
  | 'hustoj'
  | 'qduoj'
  | 'kattis';

export type CompilableSource =
  | string
  | {
      file: string;
      lang: string;
    };

export type ProblemTestCase = {
  input: string;
  output?: string;
  time?: string;
  memory?: string;
  score?: number;
};

export type ProblemSubtask = {
  id?: number;
  type?: 'min' | 'max' | 'sum';
  score?: number;
  time?: string;
  memory?: string;
  if?: number[];
  cases?: ProblemTestCase[];
};

export type ProblemConfigFile = {
  type?: ProblemType;
  subType?: string;
  target?: string;
  score?: number;
  time?: string;
  memory?: string;
  filename?: string;
  checker_type?: ProblemCheckerType;
  checker?: CompilableSource;
  interactor?: CompilableSource;
  manager?: CompilableSource;
  validator?: CompilableSource;
  num_processes?: number;
  multi_pass?: number;
  user_extra_files?: string[];
  judge_extra_files?: string[];
  detail?: 'full' | 'case' | 'none' | boolean;
  answers?: Record<string, [string | string[], number]>;
  redirect?: string;
  cases?: ProblemTestCase[];
  subtasks?: ProblemSubtask[];
  langs?: string[];
  key?: string;
  time_limit_rate?: Record<string, number>;
  memory_limit_rate?: Record<string, number>;
};

export type ProblemConfigPageData = ProblemFilesHandlerData & {
  config: string;
  testdata: FileInfo[];
};

export type ProblemConfigValidationError = {
  path: string;
  message: string;
};
