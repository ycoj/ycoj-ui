import { generateAiTestdata } from './ai-generate-testdata';
import { searchProblems } from './auto-complete';
import { createProblem } from './create';
import { editProblem } from './edit';
import {
  deleteProblemFiles,
  generateProblemTestdata,
  getProblemFileDownloadUrl,
  getProblemFileLinks,
  refreshProblemTestdata,
  renameProblemFiles,
  uploadProblemConfig,
  uploadProblemFile,
} from './files';
import { importProblems } from './import';
import { deleteProblemSolution } from './solution-delete';
import { editProblemSolution } from './solution-edit';
import { replyProblemSolution } from './solution-reply';
import { submitProblemSolution } from './solution-submit';
import { voteSolution } from './solution-vote';
import { submitProblem } from './submit';

const Problem = {
  searchProblems,
  createProblem,
  editProblem,
  generateAiTestdata,
  getProblemFileLinks,
  getProblemFileDownloadUrl,
  refreshProblemTestdata,
  uploadProblemFile,
  uploadProblemConfig,
  renameProblemFiles,
  deleteProblemFiles,
  generateProblemTestdata,
  importProblems,
  submitProblem,
  voteSolution,
  submitProblemSolution,
  editProblemSolution,
  replyProblemSolution,
  deleteProblemSolution,
};

export default Problem;
