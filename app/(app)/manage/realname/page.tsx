import ServerApis from '@/api/server/method';
import RealnameReviewFilter from '@/features/realname/manage/realname-review-filter';
import RealnameReviewList from '@/features/realname/manage/realname-review-list';
import { getUser } from '@/features/user/lib/get-user';
import { PRIV } from '@/features/user/lib/priv';
import Pagination from '@/shared/components/pagination';
import type { RealnameFilterStatus } from '@/shared/types/realname';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('realnameManage') };
}

type SearchParams = {
  page?: string;
  status?: string;
};

function parsePage(value?: string) {
  const page = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseStatus(value?: string): RealnameFilterStatus {
  return value === 'all' ||
    value === 'approved' ||
    value === 'rejected' ||
    value === 'pending'
    ? value
    : 'pending';
}

export default async function RealnameManagePage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getUser();
  if (user.priv !== PRIV.PRIV_ALL) redirect('/home');

  const searchParams = await searchParamsPromise;
  const page = parsePage(searchParams.page);
  const status = parseStatus(searchParams.status);
  const data = await ServerApis.Realname.getRealnameApplications(page, status);
  const t = await getTranslations('realname.manage');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold" data-llm-text={t('title')}>
            {t('title')}
          </h1>
          <p
            className="mt-1 text-sm text-muted-foreground"
            data-llm-text={t('count', { count: data.count })}
          >
            {t('count', { count: data.count })}
          </p>
        </div>
        <RealnameReviewFilter value={data.filterStatus} />
      </div>
      <RealnameReviewList data={data} />
      <Pagination page={data.page} totalPages={data.numPages} />
    </div>
  );
}
