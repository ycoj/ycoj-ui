import { getPreliminaryDetail } from '@/features/preliminary/detail/get-preliminary-detail';
import PreliminaryAnswerProvider from '@/features/preliminary/detail/preliminary-answer-provider';
import PreliminaryContent from '@/features/preliminary/detail/preliminary-content';
import PreliminarySidebar from '@/features/preliminary/detail/preliminary-sidebar';
import PreliminarySubmitBar from '@/features/preliminary/detail/preliminary-submit-bar';
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

  const allowedAnswers: Record<string, string[]> = {};
  for (const section of data.paper.sections) {
    for (const question of section.questions) {
      allowedAnswers[question.id] =
        question.type === 'true_false'
          ? ['true', 'false']
          : (question.options ?? []).map((option) => option.id);
    }
  }
  const draftId = `${user?._id ?? 0}/preliminary/${paperId}@${data.paper.revision}`;

  return (
    <PreliminaryAnswerProvider
      draftId={draftId}
      allowedAnswers={allowedAnswers}
      isReadOnly={!data.canSubmit}
    >
      <div className="space-y-6">
        <TwoColumnLayout
          ratio="8-2"
          left={
            <div className="space-y-4">
              <PreliminaryContent data={data} isReadOnly={!data.canSubmit} />
              <PreliminarySubmitBar
                paperId={paperId}
                revision={data.paper.revision}
                draftId={draftId}
                canSubmit={data.canSubmit}
              />
            </div>
          }
          right={
            <PreliminarySidebar
              paperId={paperId}
              data={data}
              owner={data.owner}
              canEdit={data.canEdit}
            />
          }
        />
      </div>
    </PreliminaryAnswerProvider>
  );
}
