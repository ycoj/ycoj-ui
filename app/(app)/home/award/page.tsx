import ServerApis from '@/api/server/method';
import AwardPage from '@/features/award/user/award-page';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('awardCertification') };
}

type SearchParams = { page?: string; others?: string };

export default async function HomeAwardPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParamsPromise;
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
  const data = await ServerApis.Award.getAwardPage(
    page,
    params.others === '1' || params.others === 'true'
  );
  return <AwardPage data={data} />;
}
