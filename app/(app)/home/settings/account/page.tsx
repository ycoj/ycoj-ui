import AccountSettingsPage from '@/features/account/settings/account-settings-page';
import { getAccountSettings } from '@/features/account/settings/get-account-settings';
import Errored from '@/shared/components/errored/errored';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('accountSettings') };
}

export default async function AccountSettingsRoute() {
  const data = await getAccountSettings();
  if ('error' in data) return <Errored error={data.error} />;
  return <AccountSettingsPage data={data} />;
}
