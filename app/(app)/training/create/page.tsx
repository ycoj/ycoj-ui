import ServerApis from '@/api/server/method';
import TrainingCreateForm from '@/features/training/create/training-create-form';
import { getTrainingCreateDefaults } from '@/features/training/form/training-form-utils';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, PERM } from '@/features/user/lib/priv';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('createTraining') };
}

export default async function TrainingCreatePage() {
  const [user, homepage] = await Promise.all([
    getUser(),
    ServerApis.UI.getHomepage(),
  ]);
  if (!hasPerm(user, PERM.PERM_CREATE_TRAINING)) redirect('/training');

  return (
    <TrainingCreateForm
      domainId={homepage.domain._id}
      defaultValues={getTrainingCreateDefaults()}
      canPin={hasPerm(user, PERM.PERM_PIN_TRAINING)}
    />
  );
}
