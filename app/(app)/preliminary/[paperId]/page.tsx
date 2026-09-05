import PreliminaryAnswerProvider from '@/features/preliminary/detail/preliminary-answer-provider';
import PreliminaryContent from '@/features/preliminary/detail/preliminary-content';
import PreliminaryMobileNavigation from '@/features/preliminary/detail/preliminary-mobile-navigation';
import PreliminarySidebar from '@/features/preliminary/detail/preliminary-sidebar';
import PreliminarySubmitBar from '@/features/preliminary/detail/preliminary-submit-bar';
import { getPreliminaryDetail } from '@/features/preliminary/lib/preliminary-loaders';
import { buildAllowedAnswers } from '@/features/preliminary/lib/preliminary-utils';
import { getUser } from '@/features/user/lib/get-user';
import { Errored } from '@/shared/components/errored';
import TwoColumnLayout from '@/shared/layout/two-column';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Params = {
  paperId: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { paperId } = await params;
  const data = await getPreliminaryDetail(paperId);
  const t = await getTranslations('metadata');

  if ('error' in data) {
    return {
      title: t('preliminaryDetail'),
    };
  }

  return {
    title: data.paper.title || t('preliminaryDetail'),
  };
}

export default async function PreliminaryDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { paperId } = await params;
  const [data, user] = await Promise.all([
    getPreliminaryDetail(paperId),
    getUser(),
  ]);
  const t = await getTranslations('preliminary');

  if ('error' in data) {
    return <Errored title={t('notPublished')} error={data.error} />;
  }

  const allowedAnswers = buildAllowedAnswers(data.paper.sections);
  const draftId = `${user?._id ?? 0}/preliminary/${paperId}@${data.paper.revision}`;

  return (
    <PreliminaryAnswerProvider
      key={draftId}
      draftId={draftId}
      allowedAnswers={allowedAnswers}
      isReadOnly={!data.canSubmit}
    >
      <div className="space-y-6 [&_.markdown]:min-w-0 [&_.markdown]:max-w-full [&_.markdown]:overflow-x-auto">
        <TwoColumnLayout
          ratio="8-2"
          left={
            <div className="min-w-0 space-y-4">
              <PreliminaryContent data={data} isReadOnly={!data.canSubmit} />
              {/* The submit bar always renders here: mobile navigation is
              always provided, so the bar is never empty even for
              read-only viewers. */}
              <PreliminarySubmitBar
                paperId={paperId}
                revision={data.paper.revision}
                navigation={
                  <PreliminaryMobileNavigation paperId={paperId} data={data} />
                }
                canSubmit={data.canSubmit}
              />
            </div>
          }
          right={
            <div className="hidden md:block">
              <PreliminarySidebar
                paperId={paperId}
                data={data}
                canEdit={data.canEdit}
              />
            </div>
          }
        />
      </div>
    </PreliminaryAnswerProvider>
  );
}
