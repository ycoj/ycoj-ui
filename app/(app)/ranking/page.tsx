import ServerApis from '@/api/server/method';
import RankingLeaderboard from '@/features/ranking/ranking-leaderboard';
import Pagination from '@/shared/components/pagination';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '排名',
};

export type SearchParams = {
  page?: string;
};

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function RankingPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await searchParamsPromise;
  const page = parsePage(searchParams.page);

  const data = await ServerApis.Ranking.getRankingList(page);
  /** Page size derived from total users and total pages (for rank index) */
  const pageSize = data.pageSize;

  return (
    <div className="space-y-4" data-llm-visible="true">
      <RankingLeaderboard
        udocs={data.udocs}
        page={data.page}
        pageSize={pageSize}
      />
      <div className="pt-1">
        <Pagination page={data.page} totalPages={data.upcount} />
      </div>
    </div>
  );
}
