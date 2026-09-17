import LandingPage from '@/features/landing/landing-page';
import { getUser } from '@/features/user/lib/get-user';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('landing');

  return {
    title: t('metadataTitle'),
    description: t('metadataDescription'),
  };
}

export default async function IndexPage() {
  const user = await getUser();

  if (user?._id > 0) {
    redirect('/home');
  }

  return <LandingPage siteName={process.env.SITE_NAME ?? ''} />;
}
