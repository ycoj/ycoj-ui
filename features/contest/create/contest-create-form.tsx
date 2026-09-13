'use client';

import ClientApis from '@/api/client/method';
import ContestForm from '@/features/contest/form/contest-form';
import {
  buildCreateContestPayload,
  type ContestFormValues,
} from '@/features/contest/form/contest-form-utils';
import { requireTid } from '@/shared/lib/backend-response';
import { useTranslations } from 'next-intl';

type Props = {
  defaultValues: ContestFormValues;
  canAutoHide: boolean;
  domainId: string;
};

export default function ContestCreateForm({
  defaultValues,
  canAutoHide,
  domainId,
}: Props) {
  const t = useTranslations('contestCreate');

  return (
    <ContestForm
      mode="create"
      defaultValues={defaultValues}
      canAutoHide={canAutoHide}
      domainId={domainId}
      cancelHref="/contest"
      onSubmit={async (values) => {
        const response = await ClientApis.Contest.createContest(
          buildCreateContestPayload(values)
        ).send();
        return `/contest/${requireTid(response, t('submitFailed'))}`;
      }}
    />
  );
}
