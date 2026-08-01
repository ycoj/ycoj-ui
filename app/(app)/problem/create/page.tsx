import ServerApis from '@/api/server/method';
import ProblemCreateForm from '@/features/problem/create/problem-create-form';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, PERM } from '@/features/user/lib/priv';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('createProblem') };
}

export default async function ProblemCreatePage() {
  const [user, tags] = await Promise.all([
    getUser(),
    ServerApis.Problems.getProblemTags(),
  ]);
  if (!hasPerm(user, PERM.PERM_CREATE_PROBLEM)) redirect('/problem');

  return <ProblemCreateForm tags={tags} />;
}
