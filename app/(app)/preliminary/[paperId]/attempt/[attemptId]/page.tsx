import { getPreliminaryAttempt } from '@/features/preliminary/attempt/get-preliminary-attempt';
import PreliminaryAttemptContent from '@/features/preliminary/attempt/preliminary-attempt-content';
import { Errored } from '@/shared/components/errored';
import { Button } from '@/shared/components/ui/button';
import TwoColumnLayout from '@/shared/layout/two-column';
import { ArrowLeft, History } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

type Params = {
  paperId: string;
  attemptId: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { paperId, attemptId } = await params;
  const data = await getPreliminaryAttempt(paperId, attemptId);
  const t = await getTranslations('metadata');

  if ('error' in data) {
    return {
      title: t('preliminaryAttempt'),
    };
  }

  return {
    title: data.paper.title || t('preliminaryAttempt'),
  };
}

export default async function PreliminaryAttemptPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { paperId, attemptId } = await params;
  const data = await getPreliminaryAttempt(paperId, attemptId);
  const t = await getTranslations('preliminary');

  if ('error' in data) {
    return <Errored title={t('noAttempts')} error={data.error} />;
  }

  return (
    <div className="space-y-6">
      <TwoColumnLayout
        ratio="8-2"
        left={<PreliminaryAttemptContent data={data} />}
        right={
          <div className="w-full space-y-1" data-llm-visible="true">
            <Button
              asChild
              className="h-10 w-full justify-start gap-3 px-4"
              variant="ghost"
            >
              <Link href={`/preliminary/${paperId}`}>
                <ArrowLeft strokeWidth={2} />
                <span data-llm-text={t('backToPaper')}>{t('backToPaper')}</span>
              </Link>
            </Button>
            <Button
              asChild
              className="h-10 w-full justify-start gap-3 px-4"
              variant="ghost"
            >
              <Link href="/preliminary?view=attempts">
                <History strokeWidth={2} />
                <span data-llm-text={t('myAttempts')}>{t('myAttempts')}</span>
              </Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
