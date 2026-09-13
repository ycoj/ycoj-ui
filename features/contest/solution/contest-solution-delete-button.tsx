'use client';

import ClientApis from '@/api/client/method';
import DeleteConfirmPopover from '@/shared/components/delete-confirm-popover';
import { useTranslations } from 'next-intl';

type Props = {
  tid: string;
  sid: string;
};

export default function ContestSolutionDeleteButton({ tid, sid }: Props) {
  const t = useTranslations('contestSolution');

  return (
    <DeleteConfirmPopover
      successHref={`/contest/${tid}`}
      onDelete={async () =>
        await ClientApis.Contest.deleteContestSolution(tid, sid).send()
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
