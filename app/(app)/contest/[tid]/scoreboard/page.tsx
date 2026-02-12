import ContestTitle from '@/features/contest/contest-title';
import ContestScoreboard from '@/features/contest/scoreboard/contest-scoreboard';
import { getContestScoreboard } from '@/features/contest/scoreboard/get-contest-scoreboard';
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
  const data = await getContestScoreboard(tid);

  return {
    title: `${data.tdoc.title} - 成绩表`,
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
    <div className="space-y-6">
      <ContestTitle tdoc={data.tdoc} />
      <ContestScoreboard data={data} tid={tid} pageType="contest" />
    </div>
  );
}
