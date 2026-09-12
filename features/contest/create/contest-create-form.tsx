'use client';

import ClientApis from '@/api/client/method';
import ContestForm from '@/features/contest/form/contest-form';
import {
  buildCreateContestPayload,
  type ContestFormValues,
} from '@/features/contest/form/contest-form-utils';
import parseErrorMessage from '@/shared/components/errored/parse-message';
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
        if ('error' in response)
          throw new Error(parseErrorMessage(response.error));
        if (!response?.tid) throw new Error(t('submitFailed'));
        return `/contest/${response.tid}`;
      }}
    />
  );
}
