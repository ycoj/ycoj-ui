import ServerApis from '@/api/server/method';
import { canEditSystem } from '@/features/manage/manage-access';
import ProblemFeedbackFilter from '@/features/problem/feedback/problem-feedback-filter';
import ProblemFeedbackList from '@/features/problem/feedback/problem-feedback-list';
import { getUser } from '@/features/user/lib/get-user';
import Pagination from '@/shared/components/pagination';
import type { ProblemFeedbackFilterStatus } from '@/shared/types/problem-feedback';
import { MessageSquareWarning } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('problemFeedbackManage') };
}

function parsePage(value?: string) {
  const page = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseStatus(value?: string): ProblemFeedbackFilterStatus {
  return value === 'all' ||
    value === 'pending' ||
    value === 'processing' ||
    value === 'resolved' ||
    value === 'invalid'
    ? value
    : 'pending';
}

export default async function ProblemFeedbackManagePage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const user = await getUser();
  if (!canEditSystem(user)) redirect('/home');
  const searchParams = await searchParamsPromise;
  const page = parsePage(searchParams.page);
  const status = parseStatus(searchParams.status);
  const data = await ServerApis.Problems.getProblemFeedback(page, status);
  const t = await getTranslations('problemFeedback.manage');

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <h1
          className="flex items-center gap-2 text-xl font-semibold"
          data-llm-text={t('title')}
        >
          <MessageSquareWarning className="size-5" aria-hidden="true" />
          {t('title')}
        </h1>
        <p
          className="text-sm text-muted-foreground"
          data-llm-text={t('count', { count: data.count })}
        >
          {t('count', { count: data.count })}
        </p>
      </header>
      <ProblemFeedbackFilter value={data.status} />
      <ProblemFeedbackList data={data} />
      <Pagination page={data.page} totalPages={data.pcount} />
    </div>
  );
}
