import { submitContestBulk } from './bulk-submit';
import { createContest } from './create';
import {
  deleteContestFiles,
  setContestProblemScore,
  uploadContestFile,
} from './management';
import {
  addContestUsers,
  markContestBalloonDone,
  postContestClarification,
  removeContestUser,
  resumeContestUser,
  setContestBalloonColor,
  toggleContestUserRank,
} from './management-actions';
import { getContestProblems } from './problems';
import { attendContest } from './registration';
import { unlockScoreboard } from './scoreboard';
import { deleteContestSolution, saveContestSolution } from './solution';
import { deleteContest, editContest } from '@/api/client/method/contest/edit';

const Contest = {
  createContest,
  editContest,
  deleteContest,
  attendContest,
  getContestProblems,
  unlockScoreboard,
  uploadContestFile,
  deleteContestFiles,
  setContestProblemScore,
  postContestClarification,
  addContestUsers,
  toggleContestUserRank,
  resumeContestUser,
  removeContestUser,
  setContestBalloonColor,
  markContestBalloonDone,
  submitContestBulk,
  saveContestSolution,
  deleteContestSolution,
};

export default Contest;
