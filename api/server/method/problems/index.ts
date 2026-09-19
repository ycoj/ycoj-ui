import { getProblemsByIds } from './by-ids';
import { getProblemConfig } from './config';
import { getProblemDetail } from './detail';
import { getProblemFeedback } from './feedback';
import { getProblemFiles } from './files';
import { getProblemsList } from './list';
import { getProblemSolution } from './solution';
import { getSolutionReview } from './solution-review';
import { submitProblem } from './submit';
import { getProblemTags } from './tags';
import { getAiGenerationOptions } from '@/api/server/method/problems/ai-generation';

const Problems = {
  getAiGenerationOptions,
  getProblemsList,
  getProblemConfig,
  getProblemDetail,
  getProblemFeedback,
  getProblemFiles,
  submitProblem,
  getProblemSolution,
  getSolutionReview,
  getProblemTags,
  getProblemsByIds,
};

export default Problems;
