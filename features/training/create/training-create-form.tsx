'use client';

import ClientApis from '@/api/client/method';
import TrainingForm from '@/features/training/form/training-form';
import {
  buildTrainingPayload,
  type TrainingFormValues,
} from '@/features/training/form/training-form-utils';
import { useTranslations } from 'next-intl';

type Props = {
  defaultValues: TrainingFormValues;
  domainId: string;
  canPin: boolean;
};

export default function TrainingCreateForm({
  defaultValues,
  domainId,
  canPin,
}: Props) {
  const t = useTranslations('trainingForm');

  return (
    <TrainingForm
      mode="create"
      defaultValues={defaultValues}
      domainId={domainId}
      cancelHref="/training"
      canPin={canPin}
      onSubmit={async (values) => {
        const response = await ClientApis.Training.createTraining(
          buildTrainingPayload(values)
        ).send();
        if (!response?.tid) throw new Error(t('submitFailed'));
        return `/training/${response.tid}`;
      }}
    />
  );
}
