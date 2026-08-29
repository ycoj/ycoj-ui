import { createContest } from './create';
import { getContestProblems } from './problems';
import { attendContest } from './registration';
import { unlockScoreboard } from './scoreboard';
import { editContest } from '@/api/client/method/contest/edit';

const Contest = {
  createContest,
  editContest,
  attendContest,
  getContestProblems,
  unlockScoreboard,
};

export default Contest;
