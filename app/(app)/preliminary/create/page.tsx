import PreliminaryCreateForm from '@/features/preliminary/create/preliminary-create-form';
import { getPreliminaryCreateDefaults } from '@/features/preliminary/form/preliminary-form-utils';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, PERM } from '@/features/user/lib/priv';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('createPreliminary') };
}

export default async function PreliminaryCreatePage() {
  const user = await getUser();
  if (!hasPerm(user, PERM.PERM_CREATE_PROBLEM)) redirect('/preliminary');

  return (
    <PreliminaryCreateForm defaultValues={getPreliminaryCreateDefaults()} />
  );
}
