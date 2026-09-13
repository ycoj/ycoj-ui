'use client';

import ClientApis from '@/api/client/method';
import ContestForm from '@/features/contest/form/contest-form';
import {
  buildCreateContestPayload,
  type ContestFormValues,
} from '@/features/contest/form/contest-form-utils';
import ConfirmDeleteButton from '@/shared/components/confirm-delete-button';
import { requireTid } from '@/shared/lib/backend-response';
import { useTranslations } from 'next-intl';

type Props = {
  tid: string;
  defaultValues: ContestFormValues;
  canAutoHide: boolean;
  domainId: string;
  canClone: boolean;
};

export default function ContestEditForm({
  tid,
  defaultValues,
  canAutoHide,
  domainId,
  canClone,
}: Props) {
  const t = useTranslations('contestEdit');

  const handleClone = async (values: ContestFormValues) => {
    const response = await ClientApis.Contest.createContest(
      buildCreateContestPayload(values)
    ).send();
    return `/contest/${requireTid(response, t('cloneFailed'))}`;
  };

  return (
    <ContestForm
      mode="edit"
      defaultValues={defaultValues}
      canAutoHide={canAutoHide}
      domainId={domainId}
      cancelHref={`/contest/${tid}`}
      onSubmit={async (values) => {
        const response = await ClientApis.Contest.editContest(
          tid,
          buildCreateContestPayload(values)
        ).send();
        return `/contest/${requireTid(response, t('submitFailed'))}`;
      }}
      onClone={canClone ? handleClone : undefined}
      extraActions={(isSubmitting) => (
        <ConfirmDeleteButton
          id={tid}
          namespace="contestEdit"
          listRoute="/contest"
          disabled={isSubmitting}
          onDelete={(id) => ClientApis.Contest.deleteContest(id).send()}
        />
      )}
    />
  );
}
