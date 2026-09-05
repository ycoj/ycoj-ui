'use client';

import { useDeletePreliminary } from '@/features/preliminary/lib/use-delete-preliminary';
import { Button } from '@/shared/components/ui/button';
import { FieldError } from '@/shared/components/ui/field';
import { Pencil, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = {
  paperId: string;
};

export default function PreliminaryEditActions({ paperId }: Props) {
  const t = useTranslations('preliminary');
  const common = useTranslations('common');
  const { deleting, deleteError, handleDelete } = useDeletePreliminary(paperId);

  return (
    <div className="space-y-1">
      <Button
        asChild
        className="h-11 w-full md:h-10 justify-start gap-3 px-4"
        variant="ghost"
      >
        <Link href={`/preliminary/${paperId}/edit`}>
          <Pencil strokeWidth={2} />
          <span data-llm-text={common('edit')}>{common('edit')}</span>
        </Link>
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={deleting}
        onClick={() => void handleDelete()}
        className="h-11 w-full md:h-10 justify-start gap-3 px-4 text-destructive hover:text-destructive"
      >
        <Trash strokeWidth={2} />
        <span data-llm-text={deleting ? t('deleting') : t('delete')}>
          {deleting ? t('deleting') : t('delete')}
        </span>
      </Button>
      <FieldError errors={deleteError ? [{ message: deleteError }] : []} />
    </div>
  );
}
