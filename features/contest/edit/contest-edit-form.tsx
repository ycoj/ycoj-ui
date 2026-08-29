'use client';

import ClientApis from '@/api/client/method';
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
};

export default function ContestEditForm({
  tid,
  defaultValues,
  canAutoHide,
  domainId,
}: Props) {
  const t = useTranslations('contestEdit');

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
    />
  );
}
