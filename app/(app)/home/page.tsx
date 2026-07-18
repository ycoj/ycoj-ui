import Homepage from '@/features/homepage/homepage';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('home') };
}

export default function Page() {
  return <Homepage />;
}
