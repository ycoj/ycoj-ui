import { getContestDetail } from './detail';
import { getContestList } from './list';
import { getContestProblems } from './problems';
import { getContestScoreboard } from './scoreboard';
import { getContestEdit } from '@/api/server/method/contests/edit';

const Contests = {
  getContestList,
  getContestDetail,
  getContestEdit,
  getContestProblems,
  getContestScoreboard,
};

export default Contests;
