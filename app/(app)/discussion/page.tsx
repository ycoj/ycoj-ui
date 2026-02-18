import ServerApis from '@/api/server/method';
import DiscussionList from '@/features/discussion/list/discussion-list';
import DiscussionNodeFilter from '@/features/discussion/list/discussion-node-filter';
import Pagination from '@/shared/components/pagination';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '讨论列表',
};

export type SearchParams = {
  page?: string;
  node?: string;
};

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function normalizeParam(value?: string) {
  const normalized = value?.trim();
  return normalized && normalized !== 'all' ? normalized : undefined;
}

export default async function DiscussionPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await searchParamsPromise;
  const page = parsePage(searchParams.page);
  const nodeId = normalizeParam(searchParams.node);

  const data = nodeId
    ? await ServerApis.Discussion.getDiscussionInNode('node', nodeId, page)
    : await ServerApis.Discussion.getDiscussionMain(page);

  return (
    <div className="space-y-4">
      <DiscussionNodeFilter vnodes={data.vnodes} />
      <DiscussionList data={data} />
      <div className="pt-1">
        <Pagination page={data.page} totalPages={data.dpcount} />
      </div>
    </div>
  );
}
