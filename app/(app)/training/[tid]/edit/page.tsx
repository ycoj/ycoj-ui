import ServerApis from '@/api/server/method';
import { getTrainingEdit } from '@/features/training/edit/get-training-edit';
import { resolveTrainingSections } from '@/features/training/edit/resolve-training-sections';
import TrainingEditForm from '@/features/training/edit/training-edit-form';
import { mapTrainingEditToFormValues } from '@/features/training/form/training-form-utils';
import { canEditTraining } from '@/features/training/lib/can-edit-training';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, PERM } from '@/features/user/lib/priv';
import { Errored } from '@/shared/components/errored';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Params = { tid: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { tid } = await params;
  const data = await getTrainingEdit(tid);
  const t = await getTranslations('metadata');
  if ('error' in data) return { title: t('editTraining') };
  return { title: `${data.tdoc.title} - ${t('editTraining')}` };
}

export default async function TrainingEditPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { tid } = await params;
  const [data, user, homepage] = await Promise.all([
    getTrainingEdit(tid),
    getUser(),
    ServerApis.UI.getHomepage(),
  ]);
  const t = await getTranslations('error');
  if ('error' in data)
    return <Errored title={t('unavailable')} error={data.error} />;

  if (!canEditTraining(user, data.tdoc))
    return <Errored title={t('unavailable')} error={t('unavailable')} />;

  const sections = resolveTrainingSections(data.tdoc.dag ?? [], data.pdict);

  return (
    <TrainingEditForm
      tid={tid}
      defaultValues={mapTrainingEditToFormValues(data.tdoc, sections)}
      domainId={homepage.domain._id}
      canPin={hasPerm(user, PERM.PERM_PIN_TRAINING)}
    />
  );
}
