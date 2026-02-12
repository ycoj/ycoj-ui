import ContestTitle from '@/features/contest/contest-title';
import ContestScoreboard from '@/features/contest/scoreboard/contest-scoreboard';
import { getHomeworkScoreboard } from '@/features/homework/scoreboard/get-homework-scoreboard';
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
  const data = await getHomeworkScoreboard(tid);

  return {
    title: `${data.tdoc.title} - 成绩表`,
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
    <div className="space-y-6">
      <ContestTitle tdoc={data.tdoc} />
      <ContestScoreboard data={data} tid={tid} pageType="homework" />
    </div>
  );
}
