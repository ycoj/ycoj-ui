import { getContestBulkSubmit } from './bulk-submit';
import { getContestDetail } from './detail';
import { getContestList } from './list';
import {
  getContestBalloons,
  getContestClarifications,
  getContestManagement,
  getContestUsers,
} from './management';
import { getContestProblems } from './problems';
import { getContestScoreboard } from './scoreboard';
import { getContestSolution } from './solution';
import { getContestEdit } from '@/api/server/method/contests/edit';

const Contests = {
  getContestList,
  getContestDetail,
  getContestEdit,
  getContestProblems,
  getContestScoreboard,
  getContestManagement,
  getContestClarifications,
  getContestUsers,
  getContestBalloons,
  getContestBulkSubmit,
  getContestSolution,
};

export default Contests;
