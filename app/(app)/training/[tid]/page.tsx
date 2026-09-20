import { getTrainingDetail } from '@/features/training/detail/get-training-detail';
import TrainingContent from '@/features/training/detail/training-content';
import TrainingSidebar from '@/features/training/detail/training-sidebar';
import { canEditTraining } from '@/features/training/lib/can-edit-training';
import TrainingTitle from '@/features/training/training-title';
import { getUser } from '@/features/user/lib/get-user';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Params = {
  tid: string;
};

type SearchParams = {
  showTags?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { tid } = await params;
  const data = await getTrainingDetail(tid);
  const t = await getTranslations('metadata');

  return {
    title: data.tdoc.title || t('trainingDetail'),
  };
}

export default async function TrainingDetailPage({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ tid }, { showTags }] = await Promise.all([
    params,
    searchParamsPromise,
  ]);
  const [data, user] = await Promise.all([getTrainingDetail(tid), getUser()]);
  const isEnrolled = Boolean(data.tsdoc?.enroll);

  return (
    <div className="space-y-6">
      <TrainingTitle tdoc={data.tdoc} isEnrolled={isEnrolled} />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-10">
        <div className="md:col-span-8">
          <TrainingContent data={data} showTags={showTags === 'true'} />
        </div>
        <div className="md:col-span-2">
          <TrainingSidebar
            tid={tid}
            data={data}
            owner={data.udoc}
            canEdit={canEditTraining(user, data.tdoc)}
          />
        </div>
      </div>
    </div>
  );
}
