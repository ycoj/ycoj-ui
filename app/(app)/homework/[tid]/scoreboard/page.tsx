import ContestTitle from '@/features/contest/contest-title';
import ContestScoreboard from '@/features/contest/scoreboard/contest-scoreboard';
import { getHomeworkScoreboard } from '@/features/homework/scoreboard/get-homework-scoreboard';
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
  const data = await getHomeworkScoreboard(tid);
  const t = await getTranslations('metadata');

  return {
    title: `${data.tdoc.title} - ${t('scoreboard')}`,
  };
}

export default async function HomeworkScoreboardPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { tid } = await params;
  const data = await getHomeworkScoreboard(tid);

  return (
    <div className="space-y-4">
      <ContestTitle tdoc={data.tdoc} />
      <Separator />
      <ContestScoreboard data={data} tid={tid} pageType="homework" />
    </div>
  );
}
