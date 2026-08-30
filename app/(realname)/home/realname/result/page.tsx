import ServerApis from '@/api/server/method';
import RealnameResult from '@/features/realname/user/realname-result';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('realnameResult') };
}

export default async function RealnameResultPage() {
  const data = await ServerApis.Realname.getRealnameResult();
  if ('url' in data) redirect(data.url);

  return <RealnameResult data={data} />;
}
