'use client';

import ClientApis from '@/api/client/method';
import ContestSolutionDeleteButton from '@/features/contest/solution/contest-solution-delete-button';
import ContestSolutionForm from '@/features/contest/solution/contest-solution-form';
import type { ContestSolutionFormValues } from '@/features/contest/solution/contest-solution-form-utils';
import { useTranslations } from 'next-intl';

type Props = {
  tid: string;
  sid: string;
  defaultValues: ContestSolutionFormValues;
};

export default function ContestSolutionEditForm({
  tid,
  sid,
  defaultValues,
}: Props) {
  const t = useTranslations('contestSolution');

  return (
    <ContestSolutionForm
      mode="edit"
      defaultValues={defaultValues}
      cancelHref={`/contest/${tid}/solution/${sid}`}
      extraActions={<ContestSolutionDeleteButton tid={tid} sid={sid} />}
      onSubmit={async (values) => {
        const response = await ClientApis.Contest.saveContestSolution(
          tid,
          values,
          sid
        ).send();
        if ('error' in response)
          throw new Error(response.error.message || t('saveFailed'));
        // Hydro returns {sid} on success; omission means a contract breach,
        // so fail closed instead of navigating to a broken detail URL.
        if (!response.sid) throw new Error(t('saveFailed'));
        return `/contest/${tid}/solution/${response.sid}`;
      }}
    />
  );
}
