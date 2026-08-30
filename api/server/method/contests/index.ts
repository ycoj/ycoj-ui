import { getContestBulkSubmit } from '@/api/server/method/contests/bulk-submit';
import { getContestDetail } from '@/api/server/method/contests/detail';
import { getContestEdit } from '@/api/server/method/contests/edit';
import { getContestList } from '@/api/server/method/contests/list';
import {
  getContestBalloons,
  getContestClarifications,
  getContestManagement,
  getContestUsers,
} from '@/api/server/method/contests/management';
import { getContestProblems } from '@/api/server/method/contests/problems';
import { getContestScoreboard } from '@/api/server/method/contests/scoreboard';
import { getContestSolution } from '@/api/server/method/contests/solution';

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
