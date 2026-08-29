import ContestTimer from '@/features/contest/contest-timer';
import ContestTitle from '@/features/contest/contest-title';
import { getHomeworkDetail } from '@/features/homework/detail/get-homework-detail';
import HomeworkContent from '@/features/homework/detail/homework-content';
import HomeworkSidebar from '@/features/homework/detail/homework-sidebar';
import { canEditHomework } from '@/features/homework/lib/can-edit-homework';
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
  const data = await getHomeworkDetail(tid);
  const t = await getTranslations('metadata');

  return {
    title: data.tdoc.title || t('homeworkDetail'),
  };
}

export default async function HomeworkDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { tid } = await params;
  const [data, user] = await Promise.all([getHomeworkDetail(tid), getUser()]);
  const owner = data.udict[data.tdoc.owner];

  return (
    <div className="space-y-6">
      <ContestTimer contest={data.tdoc} status={data.tsdoc} />
      <ContestTitle tdoc={data.tdoc} />
      <TwoColumnLayout
        ratio="8-2"
        left={
          <HomeworkContent
            tid={tid}
            introduction={data.tdoc.content ?? ''}
            homework={data.tdoc}
            homeworkStatus={data.tsdoc}
            pdict={data.pdict}
            psdict={data.psdict}
          />
        }
        right={
          <HomeworkSidebar
            tid={tid}
            homework={data.tdoc}
            homeworkStatus={data.tsdoc}
            owner={owner}
            canEdit={canEditHomework(user, data.tdoc)}
          />
        }
      />
    </div>
  );
}
