import { getContestProblems } from './problems';
import { attendContest } from './registration';
import { unlockScoreboard } from './scoreboard';

const Contest = {
  attendContest,
  getContestProblems,
  unlockScoreboard,
};

export default Contest;
