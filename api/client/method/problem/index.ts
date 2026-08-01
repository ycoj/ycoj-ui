import { createProblem } from './create';
import { importProblems } from './import';
import { deleteProblemSolution } from './solution-delete';
import { editProblemSolution } from './solution-edit';
import { replyProblemSolution } from './solution-reply';
import { submitProblemSolution } from './solution-submit';
import { voteSolution } from './solution-vote';
import { submitProblem } from './submit';

const Problem = {
  createProblem,
  importProblems,
  submitProblem,
  voteSolution,
  submitProblemSolution,
  editProblemSolution,
  replyProblemSolution,
  deleteProblemSolution,
};

export default Problem;
