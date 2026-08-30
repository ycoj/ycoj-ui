import ServerApis from '@/api/server/method';
import SudoPage from '@/features/auth/sudo/sudo-page';
import { getUser } from '@/features/user/lib/get-user';
import type { SudoCapabilities, SudoPageData } from '@/shared/types/sudo';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect, unstable_rethrow } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('sudo');
  return { title: t('title') };
}

function sudoCapabilities(
  data: SudoPageData,
  user: { authn?: boolean; tfa?: boolean }
): SudoCapabilities {
  return {
    authn: typeof data.authn === 'boolean' ? data.authn : Boolean(user.authn),
    tfa: typeof data.tfa === 'boolean' ? data.tfa : Boolean(user.tfa),
  };
}

export default async function SudoRoutePage() {
  const user = await getUser();
  if (!user._id) redirect('/login?redirect=%2Fuser%2Fsudo');
  let available = false;
  let capabilities = sudoCapabilities({}, user);
  try {
    const data = await ServerApis.Auth.getSudoPage();
    if (!('error' in data)) {
      available = true;
      capabilities = sudoCapabilities(data, user);
    }
  } catch (error) {
    unstable_rethrow(error);
  }
  return <SudoPage available={available} capabilities={capabilities} />;
}
