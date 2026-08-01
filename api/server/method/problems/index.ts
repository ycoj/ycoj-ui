import { getProblemDetail } from './detail';
import { getProblemsList } from './list';
import { getProblemSolution } from './solution';
import { submitProblem } from './submit';
import { getProblemTags } from './tags';

const Problems = {
  getProblemsList,
  getProblemDetail,
  submitProblem,
  getProblemSolution,
  getProblemTags,
};

export default Problems;
