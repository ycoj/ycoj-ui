import { submitContestBulk } from '@/api/client/method/contest/bulk-submit';
import { createContest } from '@/api/client/method/contest/create';
import { deleteContest, editContest } from '@/api/client/method/contest/edit';
import {
  deleteContestFiles,
  setContestProblemScore,
  uploadContestFile,
} from '@/api/client/method/contest/management';
import {
  addContestUsers,
  markContestBalloonDone,
  postContestClarification,
  removeContestUser,
  resumeContestUser,
  setContestBalloonColor,
  toggleContestUserRank,
} from '@/api/client/method/contest/management-actions';
import { getContestProblems } from '@/api/client/method/contest/problems';
import { attendContest } from '@/api/client/method/contest/registration';
import { unlockScoreboard } from '@/api/client/method/contest/scoreboard';
import {
  deleteContestSolution,
  saveContestSolution,
} from '@/api/client/method/contest/solution';

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
