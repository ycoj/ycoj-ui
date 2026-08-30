import ExpirationPage from '@/features/account-expiration/expiration-page';
import { parseExpirationPage } from '@/features/account-expiration/expiration-utils';
import { getExpirationPage } from '@/features/account-expiration/get-expiration-page';
import { canManageExpiration } from '@/features/manage/manage-access';
import { getUser } from '@/features/user/lib/get-user';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('accountExpiration');
  return { title: t('title') };
}

export default async function AccountExpirationPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const user = await getUser();
  if (!canManageExpiration(user)) redirect('/home');
  const params = await searchParams;
  const page = parseExpirationPage(params.page);
  const q = params.q?.trim() ?? '';
  const state = await getExpirationPage(page, q);
  return (
    <ExpirationPage
      key={`${page}:${q}:${JSON.stringify(state)}`}
      state={state}
      query={q}
    />
  );
}
