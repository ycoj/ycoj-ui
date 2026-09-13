'use client';

import ClientApis from '@/api/client/method';
import TrainingForm from '@/features/training/form/training-form';
import {
  buildTrainingPayload,
  type TrainingFormValues,
} from '@/features/training/form/training-form-utils';
import ConfirmDeleteButton from '@/shared/components/confirm-delete-button';
import { requireTid } from '@/shared/lib/backend-response';
import { useTranslations } from 'next-intl';

type Props = {
  tid: string;
  defaultValues: TrainingFormValues;
  domainId: string;
  canPin: boolean;
};

export default function TrainingEditForm({
  tid,
  defaultValues,
  domainId,
  canPin,
}: Props) {
  const t = useTranslations('trainingForm');

  return (
    <TrainingForm
      mode="edit"
      defaultValues={defaultValues}
      domainId={domainId}
      cancelHref={`/training/${tid}`}
      canPin={canPin}
      extraActions={(isSubmitting) => (
        <ConfirmDeleteButton
          id={tid}
          namespace="trainingForm"
          listRoute="/training"
          disabled={isSubmitting}
          onDelete={(id) =>
            ClientApis.Training.deleteTraining(id, {
              operation: 'delete',
            }).send()
          }
        />
      )}
      onSubmit={async (values) => {
        const response = await ClientApis.Training.editTraining(
          tid,
          buildTrainingPayload(values)
        ).send();
        return `/training/${requireTid(response, t('submitFailed'))}`;
      }}
    />
  );
}
