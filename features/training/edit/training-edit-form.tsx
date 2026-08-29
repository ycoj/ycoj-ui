'use client';

import ClientApis from '@/api/client/method';
import TrainingForm from '@/features/training/form/training-form';
import {
  buildTrainingPayload,
  type TrainingFormValues,
} from '@/features/training/form/training-form-utils';
import { Button } from '@/shared/components/ui/button';
import { Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting || !window.confirm(t('deleteConfirm'))) return;
    setDeleting(true);
    try {
      await ClientApis.Training.deleteTraining(tid, {
        operation: 'delete',
      }).send();
      router.push('/training');
      router.refresh();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <TrainingForm
        mode="edit"
        defaultValues={defaultValues}
        domainId={domainId}
        cancelHref={`/training/${tid}`}
        canPin={canPin}
        onSubmit={async (values) => {
          const response = await ClientApis.Training.editTraining(
            tid,
            buildTrainingPayload(values)
          ).send();
          if (!response?.tid) throw new Error(t('submitFailed'));
          return `/training/${response.tid}`;
        }}
      />
      <div className="border-t pt-5">
        <Button
          type="button"
          variant="destructive"
          disabled={deleting}
          onClick={() => void handleDelete()}
        >
          <Trash />
          {deleting ? t('deleting') : t('delete')}
        </Button>
      </div>
    </div>
  );
}
