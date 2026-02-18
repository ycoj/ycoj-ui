import DiscussionContent from '@/features/discussion/detail/discussion-content';
import DiscussionReplies from '@/features/discussion/detail/discussion-replies';
import DiscussionTitle from '@/features/discussion/detail/discussion-title';
import { getDiscussionDetail } from '@/features/discussion/detail/get-discussion-detail';
import type { Metadata } from 'next';

type Params = {
  did: string;
};

type SearchParams = {
  page?: string;
};

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { did } = await params;
  const data = await getDiscussionDetail(did);

  return {
    title: data.ddoc.title || 'Discussion Detail',
  };
}

export default async function DiscussionPage({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { did } = await params;
  const searchParams = await searchParamsPromise;
  const page = parsePage(searchParams.page);
  const data = await getDiscussionDetail(did, page);
  const owner = data.udict[data.ddoc.owner];

  return (
    <div className="space-y-6">
      <DiscussionTitle
        ddoc={data.ddoc}
        owner={owner}
        vnode={data.vnode}
        drcount={data.drcount}
      />
      <DiscussionContent content={data.ddoc.content} />
      <DiscussionReplies
        did={did}
        drdocs={data.drdocs}
        udict={data.udict}
        page={data.page}
        pcount={data.pcount}
        drcount={data.drcount}
      />
    </div>
  );
}
