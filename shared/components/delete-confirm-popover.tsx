'use client';

import parseErrorMessage from '@/shared/components/errored/parse-message';
import { Button } from '@/shared/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import type { Errorable } from '@/shared/types/error';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  onDelete: () => Promise<Errorable<Record<string, never>>>;
  successHref?: string;
  deleteLabel: string;
  confirmDeleteLabel: string;
  cancelLabel: string;
  confirmLabel: string;
  deletingLabel: string;
  deleteFailedLabel: string;
};

export default function DeleteConfirmPopover({
  onDelete,
  successHref,
  deleteLabel,
  confirmDeleteLabel,
  cancelLabel,
  confirmLabel,
  deletingLabel,
  deleteFailedLabel,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const result = await onDelete();
      if ('error' in result) {
        setError(parseErrorMessage(result.error) || deleteFailedLabel);
        return;
      }
      setOpen(false);
      // Push navigates and revalidates the destination; refresh only when
      // staying on the same page (no successHref).
      if (successHref) router.push(successHref);
      else router.refresh();
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : deleteFailedLabel;
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="icon-xs"
          aria-label={deleteLabel}
          title={deleteLabel}
        >
          <Trash2 strokeWidth={2} />
          <span className="sr-only" data-llm-text={deleteLabel}>
            {deleteLabel}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" data-llm-visible="true">
        <PopoverHeader>
          <PopoverTitle data-llm-text={confirmDeleteLabel}>
            {confirmDeleteLabel}
          </PopoverTitle>
        </PopoverHeader>
        {error && (
          <p
            role="alert"
            className="text-destructive text-xs"
            data-llm-text={error}
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            <span data-llm-text={cancelLabel}>{cancelLabel}</span>
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="xs"
            onClick={handleDelete}
            disabled={submitting}
          >
            <span data-llm-text={submitting ? deletingLabel : confirmLabel}>
              {submitting ? deletingLabel : confirmLabel}
            </span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
