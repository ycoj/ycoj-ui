import ServerApis from '@/api/server/method';
import { getProblemDetail } from '@/features/problem/detail/get-problem-detail';
import ProblemEditForm from '@/features/problem/edit/problem-edit-form';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, PERM } from '@/features/user/lib/priv';
import { Errored } from '@/shared/components/errored';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Params = { pid: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { pid } = await params;
  const data = await getProblemDetail(pid);
  const t = await getTranslations('metadata');
  if ('error' in data) return { title: t('editProblem') };
  return { title: `${data.pdoc.title} - ${t('editProblem')}` };
}

export default async function ProblemEditPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { pid } = await params;
  const [data, user, tags] = await Promise.all([
    getProblemDetail(pid),
    getUser(),
    ServerApis.Problems.getProblemTags(),
  ]);
  const t = await getTranslations('problem');
  if ('error' in data)
    return <Errored title={t('unavailable')} error={data.error} />;

  const canEdit =
    Boolean(user._id) &&
    !data.pdoc.reference &&
    ((user._id === data.pdoc.owner &&
      hasPerm(user, PERM.PERM_EDIT_PROBLEM_SELF)) ||
      hasPerm(user, PERM.PERM_EDIT_PROBLEM));
  if (!canEdit)
    return <Errored title={t('unavailable')} error={t('unavailable')} />;

  return <ProblemEditForm problem={data.pdoc} tags={tags} />;
}
