import ProblemSubmitFormClient from './problem-submit-form-client';
import ServerApis from '@/api/server/method';
import { PublicProjectionProblem } from '@/shared/types/problem';

type Props = {
  problem: PublicProjectionProblem;
};

export default async function ProblemSubmitForm({ problem }: Props) {
  const languagesRes = await ServerApis.UI.getAvailableLanguages(problem.docId);
  const submitId = problem.pid || problem.docId.toString();

  return (
    <ProblemSubmitFormClient
      pid={submitId}
      languages={languagesRes.languages}
    />
  );
}
