import { createContest } from './create';
import { editContest } from './edit';
import { getContestProblems } from './problems';
import { attendContest } from './registration';
import { unlockScoreboard } from './scoreboard';

const Contest = {
  createContest,
  editContest,
  attendContest,
  getContestProblems,
  unlockScoreboard,
};

export default Contest;
