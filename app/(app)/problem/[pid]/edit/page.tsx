import ServerApis from '@/api/server/method';
import { getProblemDetail } from '@/features/problem/detail/get-problem-detail';
import ProblemEditForm from '@/features/problem/edit/problem-edit-form';
import { canEditProblem } from '@/features/problem/lib/can-edit-problem';
import { getUser } from '@/features/user/lib/get-user';
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

  const canEdit = canEditProblem(user, data.pdoc);
  if (!canEdit)
    return <Errored title={t('unavailable')} error={t('unavailable')} />;

  return <ProblemEditForm problem={data.pdoc} tags={tags} />;
}
