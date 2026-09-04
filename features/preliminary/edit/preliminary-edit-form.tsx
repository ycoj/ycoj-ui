'use client';

import PreliminaryForm from '@/features/preliminary/form/preliminary-form';
import type { PreliminaryFormValues } from '@/features/preliminary/form/preliminary-form-utils';
import { savePreliminaryValues } from '@/features/preliminary/lib/preliminary-save';
import { useDeletePreliminary } from '@/features/preliminary/lib/use-delete-preliminary';
import { Button } from '@/shared/components/ui/button';
import { FieldError } from '@/shared/components/ui/field';
import { Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

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
  const tp = useTranslations('preliminary');
  const { deleting, deleteError, handleDelete } = useDeletePreliminary(paperId);
  const handleSave = useCallback(
    (values: PreliminaryFormValues, published: boolean) =>
      savePreliminaryValues(values, published, paperId),
    [paperId]
  );

  return (
    <div className="space-y-5">
      <PreliminaryForm
        mode="edit"
        wasPublished={wasPublished}
        defaultValues={defaultValues}
        cancelHref={`/preliminary/${paperId}`}
        extraActions={
          <Button
            type="button"
            variant="destructive"
            disabled={deleting}
            aria-invalid={!!deleteError}
            onClick={() => void handleDelete()}
          >
            <Trash />
            {deleting ? tp('deleting') : tp('delete')}
          </Button>
        }
        onSave={handleSave}
      />
      <FieldError errors={deleteError ? [{ message: deleteError }] : []} />
    </div>
  );
}
