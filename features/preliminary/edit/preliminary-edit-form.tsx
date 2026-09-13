'use client';

import ClientApis from '@/api/client/method';
import PreliminaryForm from '@/features/preliminary/form/preliminary-form';
import type { PreliminaryFormValues } from '@/features/preliminary/form/preliminary-form-utils';
import { savePreliminaryValues } from '@/features/preliminary/lib/preliminary-request';
import ConfirmDeleteButton from '@/shared/components/confirm-delete-button';
import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';

type Props = {
  paperId: string;
  wasPublished: boolean;
  defaultValues: PreliminaryFormValues;
};

export default function PreliminaryEditForm({
  paperId,
  wasPublished,
  defaultValues,
}: Props) {
  const t = useTranslations('preliminaryForm');
  const handleSave = useCallback(
    (values: PreliminaryFormValues, published: boolean) =>
      savePreliminaryValues(values, published, paperId),
    [paperId]
  );
  const labels = useMemo(
    () => ({
      draft: wasPublished ? t('unpublish') : t('saveDraft'),
      publish: wasPublished ? t('saveChanges') : t('publish'),
      saving: t('saving'),
    }),
    [t, wasPublished]
  );

  return (
    <PreliminaryForm
      labels={labels}
      publishIcon={<Save />}
      defaultValues={defaultValues}
      cancelHref={`/preliminary/${paperId}`}
      extraActions={(busy) => (
        <ConfirmDeleteButton
          id={paperId}
          namespace="preliminary"
          listRoute="/preliminary"
          disabled={busy}
          onDelete={(id) => ClientApis.Preliminary.deletePreliminary(id).send()}
        />
      )}
      onSave={handleSave}
    />
  );
}
