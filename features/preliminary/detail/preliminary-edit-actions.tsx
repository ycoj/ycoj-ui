'use client';

import ClientApis from '@/api/client/method';
import ConfirmDeleteButton from '@/shared/components/confirm-delete-button';
import { Button } from '@/shared/components/ui/button';
import { Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = {
  paperId: string;
};

export default function PreliminaryEditActions({ paperId }: Props) {
  const common = useTranslations('common');

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
      <ConfirmDeleteButton
        id={paperId}
        namespace="preliminary"
        listRoute="/preliminary"
        variant="ghost"
        className="h-11 w-full md:h-10 justify-start gap-3 px-4 text-destructive hover:text-destructive"
        onDelete={(id) => ClientApis.Preliminary.deletePreliminary(id).send()}
      />
    </div>
  );
}
