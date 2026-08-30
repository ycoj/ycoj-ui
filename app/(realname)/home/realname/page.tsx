import ServerApis from '@/api/server/method';
import RealnameForm from '@/features/realname/user/realname-form';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('realname') };
}

export default async function RealnamePage() {
  const data = await ServerApis.Realname.getRealnamePage();
  if ('url' in data) redirect(data.url);

  return <RealnameForm data={data} />;
}
