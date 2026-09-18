import ServerApis from '@/api/server/method';
import AwardManage from '@/features/award/manage/award-manage';
import { getUser } from '@/features/user/lib/get-user';
import { PRIV } from '@/features/user/lib/priv';
import Pagination from '@/shared/components/pagination';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: String(t('awardManage')) };
}

type SearchParams = { page?: string; uname?: string };

export default async function AwardManagePage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getUser();
  if (
    user.priv !== PRIV.PRIV_ALL &&
    (user.priv & PRIV.PRIV_EDIT_SYSTEM) !== PRIV.PRIV_EDIT_SYSTEM
  )
    redirect('/home');
  const params = await searchParamsPromise;
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
  const uname = params.uname?.trim() ?? '';
  const data = await ServerApis.Award.getAwardManagement(page, uname);
  return (
    <div className="space-y-5">
      <AwardManage data={data} />
      <Pagination page={data.page} totalPages={data.numPages} />
    </div>
  );
}
