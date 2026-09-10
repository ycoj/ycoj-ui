'use client';

import ClientApis from '@/api/client/method';
import ContestDeleteButton from '@/features/contest/edit/contest-delete-button';
import ContestForm from '@/features/contest/form/contest-form';
import {
  buildCreateContestPayload,
  type ContestFormValues,
} from '@/features/contest/form/contest-form-utils';
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
    if (!response?.tid) throw new Error(t('cloneFailed'));
    return `/contest/${response.tid}`;
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
        if (!response?.tid) throw new Error(t('submitFailed'));
        return `/contest/${response.tid}`;
      }}
      onClone={canClone ? handleClone : undefined}
      extraActions={<ContestDeleteButton tid={tid} />}
    />
  );
}
