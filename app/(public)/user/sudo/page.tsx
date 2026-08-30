import ServerApis from '@/api/server/method';
import SudoPage from '@/features/auth/sudo/sudo-page';
import { getUser } from '@/features/user/lib/get-user';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect, unstable_rethrow } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('sudo');
  return { title: t('title') };
}

export default async function SudoRoutePage() {
  const user = await getUser();
  if (!user._id) redirect('/login?redirect=%2Fuser%2Fsudo');
  let available = false;
  try {
    const data = await ServerApis.Auth.getSudoPage();
    available = !('error' in data);
  } catch (error) {
    unstable_rethrow(error);
  }
  return (
    <SudoPage
      available={available}
      capabilities={{ authn: user.authn, tfa: user.tfa }}
    />
  );
}
