import ContestTitle from '@/features/contest/contest-title';
import ContestContent from '@/features/contest/detail/contest-content';
import ContestSidebar from '@/features/contest/detail/contest-sidebar';
import { getContestDetail } from '@/features/contest/detail/get-contest-detail';
import TwoColumnLayout from '@/shared/layout/two-column';
import type { Metadata } from 'next';

type Params = {
  tid: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { tid } = await params;
  const data = await getContestDetail(tid);

  return {
    title: data.tdoc.title || '比赛详情',
  };
}

export default async function ContestDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { tid } = await params;
  const data = await getContestDetail(tid);
  const owner = data.udict[data.tdoc.owner];

  return (
    <div className="space-y-6">
      <ContestTitle tdoc={data.tdoc} />
      <TwoColumnLayout
        ratio="8-2"
        left={
          <ContestContent tid={tid} introduction={data.tdoc.content ?? ''} />
        }
        right={
          <ContestSidebar
            tid={tid}
            contest={data.tdoc}
            contestStatus={data.tsdoc}
            owner={owner}
          />
        }
      />
    </div>
  );
}
