'use client';

import ClientApis from '@/api/client/method';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import type { ProblemFileType } from '@/shared/types/problem-file';
import Editor from '@monaco-editor/react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog } from 'radix-ui';
import { type PointerEvent, useState } from 'react';

type Props = {
  pid: string;
  tid?: string;
  type: ProblemFileType | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export default function CreateFileDialog({
  pid,
  tid,
  type,
  onOpenChange,
  onSaved,
}: Props) {
  const t = useTranslations('problem.fileManager');
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
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
    if (type === null || !name.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const file = new File([content], name.trim(), { type: 'text/plain' });
      await ClientApis.Problem.uploadProblemFile(
        pid,
        file,
        type,
        name.trim(),
        tid
      ).send();
      onOpenChange(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root open={type !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-open:animate-in data-closed:animate-out fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
        <Dialog.Content
          aria-describedby={undefined}
          className="bg-background data-open:animate-in data-closed:animate-out fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border p-5 outline-none [&_[data-slot=button]:not(:disabled)]:cursor-pointer"
          data-llm-visible="true"
        >
          <Dialog.Title
            className="pr-10 text-lg font-semibold"
            data-llm-text={t('createFile')}
          >
            {t('createFile')}
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
              aria-label={t('filename')}
              autoFocus
            />
            <div
              className="overflow-hidden rounded-lg border"
              aria-label={t('content')}
            >
              <Editor
                height="240px"
                defaultLanguage="plaintext"
                theme="vs-light"
                value={content}
                onChange={(value) => setContent(value ?? '')}
                options={{
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  padding: { top: 12, bottom: 12 },
                  tabSize: 2,
                }}
              />
            </div>
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
