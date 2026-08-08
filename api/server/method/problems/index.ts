import { getProblemDetail } from './detail';
import { getProblemFiles } from './files';
import { getProblemsList } from './list';
import { getProblemSolution } from './solution';
import { submitProblem } from './submit';
import { getProblemTags } from './tags';

const Problems = {
  getProblemsList,
  getProblemDetail,
  getProblemFiles,
  submitProblem,
  getProblemSolution,
  getProblemTags,
};

export default Problems;
