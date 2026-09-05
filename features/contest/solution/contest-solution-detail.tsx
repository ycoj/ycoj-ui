import ContestSolutionDeleteButton from './contest-solution-delete-button';
import type { ContestSolutionResponse } from '@/api/server/method/contests/solution';
import ContestSidebar from '@/features/contest/detail/contest-sidebar';
import { canShowContestScoreboard } from '@/features/contest/detail/contest-utils';
import { canEditContest } from '@/features/contest/lib/can-edit-contest';
import { getUser } from '@/features/user/lib/get-user';
import Markdown from '@/shared/components/markdown';
import { Button } from '@/shared/components/ui/button';
import TwoColumnLayout from '@/shared/layout/two-column';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

type Props = { tid: string; data: ContestSolutionResponse };

export default async function ContestSolutionDetail({ tid, data }: Props) {
  const [t, user] = await Promise.all([
    getTranslations('contestSolution'),
    getUser(),
  ]);
  return (
    <TwoColumnLayout
      ratio="8-2"
      left={
        <article className="space-y-6" data-llm-visible="true">
          <h1 className="text-2xl font-semibold">{data.csdoc.title}</h1>
          <Markdown>{data.csdoc.content}</Markdown>
          {data.canManage && (
            <div className="flex items-center gap-3">
              <Button asChild variant="secondary">
                <Link
                  href={`/contest/${tid}/solution/${data.csdoc.docId}/edit`}
                >
                  {t('edit')}
                </Link>
              </Button>
              <ContestSolutionDeleteButton tid={tid} sid={data.csdoc.docId} />
            </div>
          )}
        </article>
      }
      right={
        <aside className="space-y-1" data-llm-visible="true">
          <Button
            asChild
            variant="ghost"
            className="h-10 w-full justify-start gap-3 px-4"
          >
            <Link href={`/contest/${tid}`}>
              <ArrowLeft strokeWidth={2} />
              <span data-llm-text={t('back')}>{t('back')}</span>
            </Link>
          </Button>
          <ContestSidebar
            tid={tid}
            contest={data.tdoc}
            contestStatus={data.tsdoc}
            owner={data.udict[data.tdoc.owner]}
            showScoreboard={canShowContestScoreboard(data.tdoc, user)}
            canEdit={canEditContest(user, data.tdoc)}
          />
        </aside>
      }
    />
  );
}
