'use client';

import { Button } from '@/shared/components/ui/button';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog } from 'radix-ui';
import type { ReactNode } from 'react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  applyLabel: string;
  applyDisabled?: boolean;
  error?: string;
  // Returning false keeps the dialog open so failed applies keep their input.
  onApply: () => boolean;
  children?: ReactNode;
};

export default function UserImportDialog({
  open,
  onOpenChange,
  title,
  description,
  applyLabel,
  applyDisabled,
  error,
  onApply,
  children,
}: Props) {
  const t = useTranslations('userImport');
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-open:animate-in data-closed:animate-out fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
        <Dialog.Content
          aria-describedby={undefined}
          className="bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border p-5 shadow-xl outline-none"
          data-llm-visible="true"
        >
          <Dialog.Title
            className="pr-10 text-lg font-semibold"
            data-llm-text={title}
          >
            {title}
          </Dialog.Title>
          <Dialog.Close asChild>
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="absolute top-4 right-4"
              aria-label={t('close')}
            >
              <X aria-hidden="true" />
            </Button>
          </Dialog.Close>
          <div className="mt-4 space-y-4">
            {description && (
              <Dialog.Description
                className="text-muted-foreground text-sm"
                data-llm-text={description}
              >
                {description}
              </Dialog.Description>
            )}
            <form
              className="space-y-4"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                if (onApply()) onOpenChange(false);
              }}
            >
              {children}
              {error && (
                <p
                  role="alert"
                  className="text-destructive text-sm"
                  data-llm-text={error}
                >
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline">
                    {t('cancel')}
                  </Button>
                </Dialog.Close>
                <Button
                  type="submit"
                  disabled={applyDisabled}
                  data-llm-text={applyLabel}
                >
                  {applyLabel}
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
