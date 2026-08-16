'use client';

import { isBinaryContent, isEditableFile } from './editable-file';
import ClientApis from '@/api/client/method';
import CodeEditor from '@/shared/components/code/code-editor';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import type { FileInfo } from '@/shared/types/file';
import type { ProblemFileType } from '@/shared/types/problem-file';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog } from 'radix-ui';
import { type PointerEvent, useEffect, useState } from 'react';

type Props = {
  pid: string;
  tid?: string;
  type: ProblemFileType | null;
  editFile?: FileInfo | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onError?: (message: string) => void;
};

export default function CreateFileDialog({
  pid,
  tid,
  type,
  editFile = null,
  onOpenChange,
  onSaved,
  onError,
}: Props) {
  const t = useTranslations('problem.fileManager');
  const editing = editFile !== null;
  const notEditable = editing && !isEditableFile(editFile.name);
  const [name, setName] = useState(editFile?.name ?? '');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const errorMessage = notEditable ? t('notEditable') : error;

  useEffect(() => {
    if (type === null || editFile === null || notEditable) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await ClientApis.Problem.getProblemFileLinks(
          pid,
          [editFile.name],
          type,
          tid
        ).send();
        const url = data.links?.[editFile.name];
        if (!url) throw new Error(t('actionFailed'));
        const response = await fetch(url);
        if (!response.ok) throw new Error(t('actionFailed'));
        const text = await response.text();
        if (isBinaryContent(text)) throw new Error(t('notEditable'));
        if (!cancelled) {
          setContent(text);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          // Keep `loading` set so the editor stays hidden and an empty
          // buffer can never be saved over the original file.
          const message =
            err instanceof Error ? err.message : t('actionFailed');
          setError(message);
          onError?.(message);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
    // The parent remounts this dialog per target via `key`, so load once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (type === null || !trimmedName || busy || loading) return;
    if (/[\\/]/.test(trimmedName)) {
      setError(t('invalidFilename'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const file = new File([content], trimmedName, { type: 'text/plain' });
      await ClientApis.Problem.uploadProblemFile(
        pid,
        file,
        type,
        trimmedName,
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
      open={type !== null}
      onOpenChange={(open) => (open ? onOpenChange(true) : close())}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="data-open:animate-in data-closed:animate-out fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
        <Dialog.Content
          aria-describedby={undefined}
          className="bg-background data-open:animate-in data-closed:animate-out fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-lg border p-5 outline-none [&_[data-slot=button]:not(:disabled)]:cursor-pointer"
          data-llm-visible="true"
        >
          <Dialog.Title
            className="pr-10 text-lg font-semibold"
            data-llm-text={editing ? t('editFile') : t('createFile')}
          >
            {editing ? t('editFile') : t('createFile')}
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
              readOnly={editing}
              autoFocus={!editing}
            />
            {loading ? (
              <div
                className="text-muted-foreground flex h-120 items-center justify-center rounded-lg border text-sm"
                data-llm-text={errorMessage || t('loadingContent')}
              >
                {errorMessage || t('loadingContent')}
              </div>
            ) : (
              <CodeEditor
                value={content}
                onChange={setContent}
                height="480px"
                ariaLabel={t('content')}
              />
            )}
            {errorMessage && (
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
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
                disabled={busy || loading || !name.trim()}
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
