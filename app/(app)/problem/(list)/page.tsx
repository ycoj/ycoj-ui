import ServerApis from '@/api/server/method';
import ProblemList from '@/features/problem/list/problem-list';
import ProblemSearch from '@/features/problem/list/problem-search';
import Pagination from '@/shared/components/pagination';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('problemList') };
}

export type SearchParams = {
  q?: string;
  page?: string;
  showTags?: string;
};

export default async function ProblemListPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await searchParamsPromise;
  const { q, page, showTags } = searchParams;
  const data = await ServerApis.Problems.getProblemsList(
    q,
    parseInt(page || '1', 10)
  );

  return (
    <div className="space-y-4">
      <ProblemSearch />
      <ProblemList
        data={data}
        showTags={showTags === 'true'}
        searchParams={searchParams}
      />
      <Pagination page={data.page!} totalPages={data.ppcount!} />
    </div>
  );
}
