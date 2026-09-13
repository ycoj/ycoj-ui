'use client';

import { Button } from '@/shared/components/ui/button';
import { FieldError } from '@/shared/components/ui/field';
import { LoaderCircle } from 'lucide-react';
import { AlertDialog } from 'radix-ui';
import { useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';

export type ConfirmActionDialogProps = {
  trigger: (pending: boolean) => ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  cancelLabel: string;
  fallbackError: string;
  confirmVariant?: ComponentPropsWithoutRef<typeof Button>['variant'];
  onConfirm: () => void | Promise<void>;
};

export default function ConfirmActionDialog({
  trigger,
  title,
  description,
  confirmLabel,
  pendingLabel,
  cancelLabel,
  fallbackError,
  confirmVariant = 'destructive',
  onConfirm,
}: ConfirmActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  const onConfirmClick = async () => {
    if (pending) return;
    setError(undefined);
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : fallbackError
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) setError(undefined);
      }}
    >
      <AlertDialog.Trigger asChild>{trigger(pending)}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
        <AlertDialog.Content
          className="bg-background fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border p-5 shadow-lg"
          data-llm-visible="true"
        >
          <AlertDialog.Title
            className="text-lg font-semibold"
            data-llm-text={title}
          >
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description
            className="text-muted-foreground mt-2 text-sm"
            data-llm-text={description}
          >
            {description}
          </AlertDialog.Description>
          {error && (
            <FieldError className="mt-2" errors={[{ message: error }]} />
          )}
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="outline" disabled={pending}>
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <Button
              type="button"
              variant={confirmVariant}
              disabled={pending}
              onClick={() => void onConfirmClick()}
            >
              {pending && <LoaderCircle className="animate-spin" />}
              {pending && pendingLabel ? pendingLabel : confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
