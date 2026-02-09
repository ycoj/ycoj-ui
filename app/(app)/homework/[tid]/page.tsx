import { getHomeworkDetail } from '@/features/homework/detail/get-homework-detail';
import HomeworkContent from '@/features/homework/detail/homework-content';
import HomeworkSidebar from '@/features/homework/detail/homework-sidebar';
import HomeworkTitle from '@/features/homework/detail/homework-title';
import TwoColumnLayout from '@/shared/layout/two-column';
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
  const data = await getHomeworkDetail(tid);

  return {
    title: data.tdoc.title || '作业详情',
  };
}

export default async function HomeworkDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { tid } = await params;
  const data = await getHomeworkDetail(tid);
  const owner = data.udict[data.tdoc.owner];

  return (
    <div className="space-y-6">
      <HomeworkTitle homework={data.tdoc} />
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
          />
        }
      />
    </div>
  );
}
