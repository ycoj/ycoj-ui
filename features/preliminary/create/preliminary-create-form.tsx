'use client';

import PreliminaryForm from '@/features/preliminary/form/preliminary-form';
import type { PreliminaryFormValues } from '@/features/preliminary/form/preliminary-form-utils';
import { savePreliminaryValues } from '@/features/preliminary/lib/preliminary-request';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';

type Props = {
  defaultValues: PreliminaryFormValues;
};

export default function PreliminaryCreateForm({ defaultValues }: Props) {
  const t = useTranslations('preliminaryForm');
  const handleSave = useCallback(
    (values: PreliminaryFormValues, published: boolean) =>
      savePreliminaryValues(values, published),
    []
  );
  const labels = useMemo(
    () => ({
      draft: t('saveDraft'),
      publish: t('publish'),
      saving: t('saving'),
    }),
    [t]
  );

  return (
    <PreliminaryForm
      labels={labels}
      publishIcon={<Plus />}
      defaultValues={defaultValues}
      cancelHref="/preliminary"
      onSave={handleSave}
    />
  );
}
