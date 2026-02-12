import { getTrainingDetail } from '@/features/training/detail/get-training-detail';
import TrainingContent from '@/features/training/detail/training-content';
import TrainingSidebar from '@/features/training/detail/training-sidebar';
import TrainingTitle from '@/features/training/training-title';
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
  const data = await getTrainingDetail(tid);

  return {
    title: data.tdoc.title || '训练详情',
  };
}

export default async function TrainingDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { tid } = await params;
  const data = await getTrainingDetail(tid);
  const owner = data.udict[data.tdoc.owner];
  const isEnrolled = Boolean(data.tsdoc?.enroll);

  return (
    <div className="space-y-6">
      <TrainingTitle tdoc={data.tdoc} isEnrolled={isEnrolled} />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-10">
        <div className="md:col-span-8">
          <TrainingContent tid={tid} data={data} />
        </div>
        <div className="md:col-span-2">
          <TrainingSidebar tid={tid} data={data} owner={owner} />
        </div>
      </div>
    </div>
  );
}
