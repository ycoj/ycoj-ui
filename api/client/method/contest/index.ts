import { createContest } from './create';
import { getContestProblems } from './problems';
import { attendContest } from './registration';
import { unlockScoreboard } from './scoreboard';

const Contest = {
  createContest,
  attendContest,
  getContestProblems,
  unlockScoreboard,
};

export default Contest;
