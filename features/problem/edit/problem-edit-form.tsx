'use client';

import ClientApis from '@/api/client/method';
import ProblemForm, {
  normalizeProblemPayload,
} from '@/features/problem/form/problem-form';
import type { PublicProjectionProblem } from '@/shared/types/problem';

type Props = {
  problem: PublicProjectionProblem;
  tags: Record<string, string[]>;
};

export default function ProblemEditForm({ problem, tags }: Props) {
  const pid = problem.pid || String(problem.docId);

  return (
    <ProblemForm
      mode="edit"
      tags={tags}
      cancelHref={`/problem/${pid}`}
      defaultValues={{
        pid: problem.pid ?? '',
        title: problem.title,
        tag: problem.tag.join(', '),
        difficulty: problem.difficulty ?? 0,
        hidden: problem.hidden ?? false,
        content: problem.content,
      }}
      onSubmit={async (values) => {
        const response = await ClientApis.Problem.editProblem(
          pid,
          normalizeProblemPayload(values)
        ).send();

        if (response?.url?.startsWith('/p/'))
          return `/problem/${response.url.slice(3)}`;
        return `/problem/${values.pid.trim() || pid}`;
      }}
    />
  );
}
