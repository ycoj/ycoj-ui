'use client';

import ClientApis from '@/api/client/method';
import DeleteConfirmPopover from '@/shared/components/delete-confirm-popover';
import type { ObjectId } from '@/shared/types/shared';
import { useTranslations } from 'next-intl';

type Props = {
  pid: string | number;
  psid: ObjectId;
};

export default function SolutionDeleteButton({ pid, psid }: Props) {
  const t = useTranslations('solution');

  return (
    <DeleteConfirmPopover
      onDelete={async () =>
        await ClientApis.Problem.deleteProblemSolution(pid, psid).send()
      }
      deleteLabel={t('delete')}
      confirmDeleteLabel={t('confirmDelete')}
      cancelLabel={t('cancel')}
      confirmLabel={t('confirm')}
      deletingLabel={t('deleting')}
      deleteFailedLabel={t('deleteFailed')}
    />
  );
}
