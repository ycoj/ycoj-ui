import ContestTitle from '@/features/contest/contest-title';
import ContestContent from '@/features/contest/detail/contest-content';
import ContestSidebar from '@/features/contest/detail/contest-sidebar';
import { canShowContestScoreboard } from '@/features/contest/detail/contest-utils';
import { getContestDetail } from '@/features/contest/detail/get-contest-detail';
import { getUser } from '@/features/user/lib/get-user';
import TwoColumnLayout from '@/shared/layout/two-column';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

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
  const t = await getTranslations('metadata');

  return {
    title: data.tdoc.title || t('contestDetail'),
  };
}

export default async function ContestDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { tid } = await params;
  const [data, user] = await Promise.all([getContestDetail(tid), getUser()]);
  const owner = data.udict[data.tdoc.owner];
  const showScoreboard = canShowContestScoreboard(data.tdoc, user);

  return (
    <div className="space-y-6">
      <ContestTitle tdoc={data.tdoc} />
      <TwoColumnLayout
        ratio="8-2"
        left={
          <ContestContent
            tid={tid}
            introduction={data.tdoc.content ?? ''}
            files={data.tdoc.files ?? []}
          />
        }
        right={
          <ContestSidebar
            tid={tid}
            contest={data.tdoc}
            contestStatus={data.tsdoc}
            owner={owner}
            showScoreboard={showScoreboard}
          />
        }
      />
    </div>
  );
}
