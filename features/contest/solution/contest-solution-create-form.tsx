'use client';

import ClientApis from '@/api/client/method';
import ContestSolutionForm from '@/features/contest/solution/contest-solution-form';
import {
  getContestSolutionDefaults,
  normalizeContestSolutionPayload,
} from '@/features/contest/solution/contest-solution-form-utils';
import { useTranslations } from 'next-intl';

type Props = {
  tid: string;
};

export default function ContestSolutionCreateForm({ tid }: Props) {
  const t = useTranslations('contestSolution');

  return (
    <ContestSolutionForm
      mode="create"
      defaultValues={getContestSolutionDefaults()}
      cancelHref={`/contest/${tid}`}
      onSubmit={async (values) => {
        const response = await ClientApis.Contest.createContestSolution(
          tid,
          normalizeContestSolutionPayload(values)
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
