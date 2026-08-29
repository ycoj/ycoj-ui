'use client';

import ClientApis from '@/api/client/method';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import type { FileInfo } from '@/shared/types/file';
import type { ProblemFileType } from '@/shared/types/problem-file';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog } from 'radix-ui';
import { type PointerEvent, useState } from 'react';

type Props = {
  pid: string;
  tid?: string;
  target: { type: ProblemFileType; file: FileInfo } | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onError?: (message: string) => void;
};

export default function RenameFileDialog({
  pid,
  tid,
  target,
  onOpenChange,
  onSaved,
  onError,
}: Props) {
  const t = useTranslations('problem.fileManager');
  const [name, setName] = useState(target?.file.name ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    if (!busy) onOpenChange(false);
  };
  const handleClosePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    close();
  };
  const submit = async () => {
    const trimmedName = name.trim();
    if (!target || !trimmedName || busy) return;
    if (/[\\/]/.test(trimmedName)) {
      setError(t('invalidFilename'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      await ClientApis.Problem.renameProblemFiles(
        pid,
        [target.file.name],
        [trimmedName],
        target.type,
        tid
      ).send();
      onOpenChange(false);
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('actionFailed');
      setError(message);
      onError?.(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root
      open={target !== null}
      onOpenChange={(open) => (open ? onOpenChange(true) : close())}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="data-open:animate-in data-closed:animate-out fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
        <Dialog.Content
          aria-describedby={undefined}
          className="bg-background data-open:animate-in data-closed:animate-out fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border p-5 outline-none"
          data-llm-visible="true"
        >
          <Dialog.Title
            className="pr-10 text-lg font-semibold"
            data-llm-text={t('rename')}
          >
            {t('rename')}
          </Dialog.Title>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="absolute top-4 right-4"
            aria-label={t('close')}
            onPointerDown={handleClosePointerDown}
            onClick={(event) => {
              event.stopPropagation();
              close();
            }}
            disabled={busy}
          >
            <X />
          </Button>
          <div className="mt-5 space-y-4">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('filenamePlaceholder')}
              aria-label={t('fileNameLabel')}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onPointerDown={handleClosePointerDown}
                onClick={(event) => {
                  event.stopPropagation();
                  close();
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                type="button"
                disabled={busy || !name.trim()}
                onClick={() => void submit()}
              >
                {busy ? t('saving') : t('save')}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
