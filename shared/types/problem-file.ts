import type { Contest, ContestStatus } from './contest';
import type { FileInfo } from './file';
import type { ProblemStatus, PublicProjectionProblem } from './problem';
import type { User } from './user';

/** Selects either judge test data or files published alongside the problem statement. */
export type ProblemFileType = 'testdata' | 'additional_file';

export type ProblemFilesHandlerData = {
  pdoc: PublicProjectionProblem;
  udoc: User;
  psdoc?: ProblemStatus | null;
  title: string;
  solutionCount: number;
  discussionCount: number;
  tdoc?: Contest;
  /** The contest owner when it differs from the problem owner. */
  owner_udoc?: User | null;
  /**
   * Access mode for this problem. Contest values distinguish spectators, active
   * participants, and post-contest correction access.
   */
  mode: 'normal' | 'view' | 'contest' | 'correction' | 'none';
  /** The current user's restricted contest participation record. */
  tsdoc?: ContestStatus;
};

export type ProblemFilesData = ProblemFilesHandlerData & {
  /** Files used by the judge, including inputs, outputs, checkers, and generators. */
  testdata: FileInfo[];
  /** Files available for problem-statement references and participant downloads. */
  additional_file: FileInfo[];
  /** The source problem when this problem references another problem's resources. */
  reference?: PublicProjectionProblem['reference'];
};

export type ProblemFileLinksData = ProblemFilesHandlerData & {
  /** Temporary signed download URLs keyed by the requested file names. */
  links: Record<string, string>;
};
