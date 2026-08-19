import ContestTimer from '@/features/contest/contest-timer';
import ContestTitle from '@/features/contest/contest-title';
import ContestScoreboard from '@/features/contest/scoreboard/contest-scoreboard';
import { getContestScoreboard } from '@/features/contest/scoreboard/get-contest-scoreboard';
import { Separator } from '@/shared/components/ui/separator';
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
  const data = await getContestScoreboard(tid);
  const t = await getTranslations('metadata');

  return {
    title: `${data.tdoc.title} - ${t('scoreboard')}`,
  };
}

export default async function ContestScoreboardPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { tid } = await params;
  const data = await getContestScoreboard(tid);

  return (
    <div className="space-y-4">
      <ContestTimer contest={data.tdoc} status={data.tsdoc} />
      <ContestTitle tdoc={data.tdoc} />
      <Separator />
      <ContestScoreboard data={data} tid={tid} pageType="contest" />
    </div>
  );
}
