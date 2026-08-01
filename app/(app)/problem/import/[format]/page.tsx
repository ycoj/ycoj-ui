import { PROBLEM_IMPORT_FORMATS } from '@/api/client/method/problem/import';
import ProblemImportForm from '@/features/problem/create/problem-import-form';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, hasPriv, PERM, PRIV } from '@/features/user/lib/priv';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';

type Props = {
  params: Promise<{ format: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { format } = await params;
  const t = await getTranslations('metadata');
  return { title: t('importProblem', { format: format.toUpperCase() }) };
}

export default async function ProblemImportPage({ params }: Props) {
  const { format } = await params;
  if (!PROBLEM_IMPORT_FORMATS.includes(format as never)) notFound();

  const user = await getUser();
  if (!hasPerm(user, PERM.PERM_CREATE_PROBLEM)) redirect('/problem');

  return (
    <ProblemImportForm
      format={format as (typeof PROBLEM_IMPORT_FORMATS)[number]}
      canKeepUser={hasPriv(user, PRIV.PRIV_EDIT_SYSTEM)}
    />
  );
}
