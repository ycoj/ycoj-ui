'use client';

import { useProblemConfig } from './problem-config-context';
import ClientApis from '@/api/client/method';
import { formatFileSize } from '@/features/problem/files/format-file-size';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Progress } from '@/shared/components/ui/progress';
import { cn } from '@/shared/lib/utils';
import type { FileInfo } from '@/shared/types/file';
import JSZip from 'jszip';
import {
  ChevronDown,
  Download,
  FileArchive,
  FileUp,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AlertDialog, Dialog } from 'radix-ui';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

type Props = {
  pid: string;
  docId: number;
  title: string;
};

function triggerDownload(url: string, filename: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

export default function TestdataSidebar({ pid, docId, title }: Props) {
  const t = useTranslations('problem.config');
  const fileManagerT = useTranslations('problem.fileManager');
  const { state, dispatch } = useProblemConfig();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FileInfo | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FileInfo | null>(null);
  const [expanded, setExpanded] = useState(false);

  const busy = uploading || downloadingAll || state.mutatingFiles;

  const refresh = async () => {
    const testdata = await ClientApis.Problem.refreshProblemTestdata(pid);
    dispatch({ type: 'testdataRefreshed', testdata });
    return testdata;
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length || busy) return;
    const selected = Array.from(files);
    const weights = new Map(selected.map((file) => [file, 0]));
    const total = selected.reduce(
      (sum, file) => sum + Math.max(file.size, 1),
      0
    );
    setExpanded(true);
    setUploading(true);
    setUploadProgress(0);
    try {
      const results = await Promise.allSettled(
        selected.map(async (file) => {
          const request = ClientApis.Problem.uploadProblemFile(
            pid,
            file,
            'testdata'
          );
          request.onUpload(({ loaded, total: fileTotal }) => {
            weights.set(
              file,
              fileTotal > 0 ? Math.min(1, loaded / fileTotal) : 0
            );
            const loadedWeight = selected.reduce(
              (sum, item) =>
                sum + Math.max(item.size, 1) * (weights.get(item) ?? 0),
              0
            );
            setUploadProgress(Math.round((loadedWeight / total) * 100));
          });
          return request.send();
        })
      );
      const failed = results.filter((result) => result.status === 'rejected');
      if (failed.length === results.length) {
        toast.error(t('uploadFailed', { count: results.length }));
      } else if (failed.length) {
        toast.error(
          t('uploadPartialFailure', {
            failed: failed.length,
            total: results.length,
          })
        );
      } else {
        toast.success(t('uploadSuccess', { count: results.length }));
      }

      try {
        await refresh();
      } catch {
        dispatch({ type: 'testdataRefreshed', testdata: [] });
        toast.error(t('refreshFailed'));
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const downloadFile = async (file: FileInfo) => {
    if (busy) return;
    try {
      const url = await ClientApis.Problem.getProblemFileDownloadUrl(
        pid,
        file.name
      );
      if (!url) throw new Error(t('downloadFailed'));
      triggerDownload(url, file.name);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('downloadFailed'));
    }
  };

  const downloadAll = async () => {
    if (!state.testdata.length || busy) return;
    setDownloadingAll(true);
    try {
      const response = await ClientApis.Problem.getProblemFileLinks(
        pid,
        state.testdata.map((file) => file.name),
        'testdata'
      ).send();
      const zip = new JSZip();
      const batchSize = 4;
      for (
        let offset = 0;
        offset < state.testdata.length;
        offset += batchSize
      ) {
        const batch = state.testdata.slice(offset, offset + batchSize);
        await Promise.all(
          batch.map(async (file) => {
            const url = response.links[file.name];
            if (!url) throw new Error(t('downloadFailed'));
            const result = await fetch(url);
            if (!result.ok) throw new Error(t('downloadFailed'));
            zip.file(file.name, await result.blob());
          })
        );
      }
      const blob = await zip.generateAsync({ type: 'blob', streamFiles: true });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `${docId} ${title}.zip`);
      setTimeout(() => URL.revokeObjectURL(url), 0);
      toast.success(t('archiveReady'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('downloadFailed'));
    } finally {
      setDownloadingAll(false);
    }
  };

  const rename = async () => {
    const nextName = renameValue.trim();
    if (!renameTarget || !nextName || nextName === renameTarget.name || busy)
      return;
    if (/[\\/]/.test(nextName)) {
      toast.error(fileManagerT('invalidFilename'));
      return;
    }
    const oldName = renameTarget.name;
    dispatch({ type: 'fileMutationStarted' });
    try {
      await ClientApis.Problem.renameProblemFiles(
        pid,
        [oldName],
        [nextName],
        'testdata'
      ).send();
      dispatch({ type: 'fileRenamed', oldName, newName: nextName });
      await refresh();
      setRenameTarget(null);
      toast.success(t('renameSuccess'));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('fileActionFailed')
      );
    } finally {
      dispatch({ type: 'fileMutationFinished' });
    }
  };

  const remove = async () => {
    if (!deleteTarget || busy) return;
    const name = deleteTarget.name;
    dispatch({ type: 'fileMutationStarted' });
    try {
      await ClientApis.Problem.deleteProblemFiles(
        pid,
        [name],
        'testdata'
      ).send();
      dispatch({ type: 'filesDeleted', names: [name] });
      await refresh();
      setDeleteTarget(null);
      toast.success(t('deleteSuccess'));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('fileActionFailed')
      );
    } finally {
      dispatch({ type: 'fileMutationFinished' });
    }
  };

  return (
    <aside
      className="min-w-0 rounded-lg bg-muted/20 xl:flex xl:h-[60vh] xl:max-h-[60vh] xl:flex-col xl:overflow-hidden"
      data-llm-visible="true"
    >
      <div className="flex min-h-12 shrink-0 items-center gap-2 px-3 py-2">
        <div className="min-w-0">
          <h2
            className="truncate text-sm font-semibold"
            data-llm-text={t('testdata')}
          >
            {t('testdata')}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('fileCount', { count: state.testdata.length })}
          </p>
        </div>
        <div className="ml-auto flex gap-1">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            title={t('uploadFiles')}
            aria-label={t('uploadFiles')}
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <FileUp />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            title={t('downloadAll')}
            aria-label={t('downloadAll')}
            disabled={busy || !state.testdata.length}
            onClick={() => void downloadAll()}
          >
            <FileArchive />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="xl:hidden"
            aria-label={expanded ? t('collapse') : t('expand')}
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
          >
            <ChevronDown
              className={cn('transition-transform', !expanded && '-rotate-90')}
            />
          </Button>
          <Input
            ref={inputRef}
            type="file"
            multiple
            accept=".zip,*/*"
            className="hidden"
            aria-label={t('uploadFiles')}
            disabled={busy}
            onChange={(event) => void uploadFiles(event.target.files)}
          />
        </div>
      </div>

      <div
        className={cn(
          !expanded && 'hidden',
          'xl:flex xl:min-h-0 xl:flex-1 xl:flex-col'
        )}
      >
        {uploading ? (
          <div className="shrink-0 space-y-2 px-3 pb-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('uploading')}</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} aria-label={t('uploadProgress')} />
          </div>
        ) : null}

        <div className="max-h-[60vh] overflow-auto xl:min-h-0 xl:max-h-none xl:flex-1">
          {state.testdata.length ? (
            <ul className="space-y-0.5 p-1">
              {state.testdata.map((file) => (
                <li
                  key={file.name}
                  className="group rounded-md px-2 py-2 hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate font-mono text-xs"
                        title={file.name}
                        data-llm-text={file.name}
                      >
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-0.5 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        title={t('download')}
                        aria-label={t('download')}
                        disabled={busy}
                        onClick={() => void downloadFile(file)}
                      >
                        <Download />
                      </Button>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        title={t('rename')}
                        aria-label={t('rename')}
                        disabled={busy}
                        onClick={() => {
                          setRenameTarget(file);
                          setRenameValue(file.name);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        title={t('delete')}
                        aria-label={t('delete')}
                        disabled={busy}
                        onClick={() => setDeleteTarget(file)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              {t('noTestdata')}
            </p>
          )}
        </div>
      </div>

      <Dialog.Root
        open={renameTarget !== null}
        onOpenChange={(open) => !open && !busy && setRenameTarget(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-5 shadow-lg">
            <Dialog.Title className="pr-10 text-lg font-semibold">
              {t('renameFile')}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="absolute top-4 right-4"
                aria-label={t('cancel')}
                disabled={busy}
              >
                <X />
              </Button>
            </Dialog.Close>
            <div className="mt-5 space-y-4">
              <Input
                value={renameValue}
                aria-label={t('filename')}
                autoFocus
                onChange={(event) => setRenameValue(event.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setRenameTarget(null)}
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="button"
                  disabled={busy || !renameValue.trim()}
                  onClick={() => void rename()}
                >
                  {t('rename')}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && !busy && setDeleteTarget(null)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-5 shadow-lg">
            <AlertDialog.Title className="text-lg font-semibold">
              {t('deleteFile')}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
              {t('deleteFileConfirm', { name: deleteTarget?.name ?? '' })}
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline" disabled={busy}>
                  {t('cancel')}
                </Button>
              </AlertDialog.Cancel>
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={() => void remove()}
              >
                {t('delete')}
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </aside>
  );
}
