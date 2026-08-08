import type { Contest, ContestStatus } from './contest';
import type { FileInfo } from './file';
import type { ProblemStatus, PublicProjectionProblem } from './problem';
import type { User } from './user';

export type ProblemFileType = 'testdata' | 'additional_file';

export type ProblemFilesHandlerData = {
  pdoc: PublicProjectionProblem;
  udoc: User;
  psdoc?: ProblemStatus | null;
  title: string;
  solutionCount: number;
  discussionCount: number;
  tdoc?: Contest;
  owner_udoc?: User | null;
  mode: 'normal' | 'view' | 'contest' | 'correction' | 'none';
  tsdoc?: ContestStatus;
};

export type ProblemFilesData = ProblemFilesHandlerData & {
  testdata: FileInfo[];
  additional_file: FileInfo[];
  reference?: PublicProjectionProblem['reference'];
};

export type ProblemFileLinksData = ProblemFilesHandlerData & {
  links: Record<string, string>;
};
