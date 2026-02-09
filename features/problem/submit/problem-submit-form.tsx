import ProblemSubmitFormClient from './problem-submit-form-client';
import ServerApis from '@/api/server/method';
import { getContestStatus } from '@/features/contest/detail/contest-utils';
import type { Contest } from '@/shared/types/contest';
import type { Homework } from '@/shared/types/homework';
import { PublicProjectionProblem } from '@/shared/types/problem';
import dayjs from 'dayjs';

type Props = {
  problem: PublicProjectionProblem;
  tid?: string;
  contest?: Contest | Homework;
};

export default async function ProblemSubmitForm({
  problem,
  tid,
  contest,
}: Props) {
  const languagesRes = await ServerApis.UI.getAvailableLanguages(problem.docId);
  const submitId = problem.pid || problem.docId.toString();

  // 判断比赛是否已结束
  const isContestEnded = contest
    ? getContestStatus(contest, dayjs()) === 'ended'
    : false;

  return (
    <ProblemSubmitFormClient
      pid={submitId}
      tid={tid}
      languages={languagesRes.languages}
      isContestEnded={isContestEnded}
    />
  );
}
