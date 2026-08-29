'use client';

import CreateFileDialog from './create-file-dialog';
import FileSection from './file-section';
import RenameFileDialog from './rename-file-dialog';
import ClientApis from '@/api/client/method';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import type { FileInfo } from '@/shared/types/file';
import type { ProblemFileType } from '@/shared/types/problem-file';
import { useUploader } from 'alova/client';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertDialog, Dialog } from 'radix-ui';
import { useRef, useState } from 'react';

type Props = {
  pid: string;
  tid?: string;
  testdata: FileInfo[];
  additionalFiles: FileInfo[];
  canManage: boolean;
  canGenerate?: boolean;
  canDownloadTestdata?: boolean;
};

type FileTarget = {
  type: ProblemFileType;
  file: FileInfo;
};

type ActiveUpload = {
  files: File[];
  progress: Map<File, number>;
};

export default function ProblemFilesManager({
  pid,
  tid,
  testdata,
  additionalFiles,
  canManage,
  canGenerate = false,
  canDownloadTestdata = canManage,
}: Props) {
  const t = useTranslations('problem.fileManager');
  const router = useRouter();
  const [createType, setCreateType] = useState<ProblemFileType | null>(null);
  const [renameTarget, setRenameTarget] = useState<FileTarget | null>(null);
  const [editTarget, setEditTarget] = useState<FileTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: ProblemFileType;
    names: string[];
  } | null>(null);
  const uploadTypeRef = useRef<ProblemFileType>('testdata');
  const uploadBatchActiveRef = useRef(false);
  const [activeUpload, setActiveUpload] = useState<ActiveUpload | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pageError, setPageError] = useState('');
  const {
    appendFiles,
    removeFiles,
    upload,
    uploading: uploaderUploading,
  } = useUploader(({ file }) => {
    const request = ClientApis.Problem.uploadProblemFile(
      pid,
      file,
      uploadTypeRef.current,
      undefined,
      tid
    );
    request.onUpload(({ loaded, total }) => {
      setActiveUpload((current) => {
        if (!current) return current;
        const progress = new Map(current.progress);
        progress.set(
          file,
          total > 0 ? Math.min(1, Math.max(0, loaded / total)) : 0
        );
        return { ...current, progress };
      });
    });
    return request;
  });
  const uploading = uploaderUploading || activeUpload !== null;
  const uploadWeight =
    activeUpload?.files.reduce(
      (total, file) => total + Math.max(file.size, 1),
      0
    ) ?? 0;
  const uploadedWeight =
    activeUpload?.files.reduce(
      (total, file) =>
        total + Math.max(file.size, 1) * (activeUpload.progress.get(file) ?? 0),
      0
    ) ?? 0;
  const uploadProgress = uploadWeight
    ? Math.round((uploadedWeight / uploadWeight) * 100)
    : 0;

  const openCreate = (type: ProblemFileType) => setCreateType(type);
  const openRename = (type: ProblemFileType, file: FileInfo) =>
    setRenameTarget({ type, file });
  const openEdit = (type: ProblemFileType, file: FileInfo) =>
    setEditTarget({ type, file });

  const deleteFiles = (type: ProblemFileType, names: string[]) => {
    if (!names.length) return;
    setPageError('');
    setDeleteTarget({ type, names });
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    const { type, names } = deleteTarget;
    setDeleting(true);
    setPageError('');
    try {
      await ClientApis.Problem.deleteProblemFiles(pid, names, type, tid).send();
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const downloadFiles = async (type: ProblemFileType, names: string[]) => {
    setPageError('');
    try {
      const data = await ClientApis.Problem.getProblemFileLinks(
        pid,
        names,
        type,
        tid
      ).send();
      const links = Object.entries(data.links ?? {});
      if (links.length !== names.length) throw new Error(t('actionFailed'));
      links.forEach(([name, url]) => {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = name;
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
      });
    } catch (err) {
      setPageError(err instanceof Error ? err.message : t('actionFailed'));
    }
  };

  const uploadFiles = async (type: ProblemFileType, files: File[]) => {
    if (!files.length || uploadBatchActiveRef.current) return;
    uploadBatchActiveRef.current = true;
    uploadTypeRef.current = type;
    setPageError('');
    try {
      await appendFiles(files.map((file) => ({ file })));
      const uploadPromise = upload();
      setActiveUpload({ files, progress: new Map() });
      const results = await uploadPromise;
      const failed = results.filter((result) => result instanceof Error).length;
      if (failed < results.length) router.refresh();
      if (failed) {
        setPageError(t('uploadFailed', { failed, total: results.length }));
      }
    } catch (err) {
      setPageError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      removeFiles();
      setActiveUpload(null);
      uploadBatchActiveRef.current = false;
    }
  };

  return (
    <div className="space-y-6">
      {pageError && (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
          data-llm-text={pageError}
        >
          {pageError}
        </p>
      )}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <FileSection
            key={`testdata-${testdata.map((file) => file.name).join(':')}`}
            type="testdata"
            files={testdata}
            canManage={canManage}
            canDownload={canDownloadTestdata}
            uploading={uploading}
            deleting={deleting}
            onCreate={openCreate}
            onUpload={uploadFiles}
            onRename={openRename}
            onEdit={openEdit}
            onDelete={deleteFiles}
            onDownload={downloadFiles}
          />
          {canGenerate && (
            <section className="space-y-4" data-llm-visible="true">
              <h2
                className="text-xl text-primary"
                data-llm-text={t('generateWithAi')}
              >
                {t('generateWithAi')}
              </h2>
              <Button asChild type="button">
                <Link href={`/problem/${pid}/generate`}>
                  <Sparkles />
                  <span data-llm-text={t('openGenerationPage')}>
                    {t('openGenerationPage')}
                  </span>
                </Link>
              </Button>
            </section>
          )}
        </div>
        <FileSection
          key={`additional-${additionalFiles.map((file) => file.name).join(':')}`}
          type="additional_file"
          files={additionalFiles}
          canManage={canManage}
          canDownload
          uploading={uploading}
          deleting={deleting}
          onCreate={openCreate}
          onUpload={uploadFiles}
          onRename={openRename}
          onEdit={openEdit}
          onDelete={deleteFiles}
          onDownload={downloadFiles}
        />
      </div>

      <CreateFileDialog
        key={
          editTarget
            ? `edit:${editTarget.type}:${editTarget.file.name}`
            : createType
              ? `create:${createType}`
              : 'closed'
        }
        pid={pid}
        tid={tid}
        type={editTarget?.type ?? createType}
        editFile={editTarget?.file ?? null}
        onOpenChange={(open) => {
          if (!open) {
            setCreateType(null);
            setEditTarget(null);
          }
        }}
        onSaved={() => router.refresh()}
        onError={setPageError}
      />
      <RenameFileDialog
        key={
          renameTarget
            ? `rename:${renameTarget.type}:${renameTarget.file.name}`
            : 'rename:closed'
        }
        pid={pid}
        tid={tid}
        target={renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        onSaved={() => router.refresh()}
        onError={setPageError}
      />

      <Dialog.Root open={activeUpload !== null} onOpenChange={() => undefined}>
        <Dialog.Portal>
          <Dialog.Overlay className="data-open:animate-in data-closed:animate-out fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
          <Dialog.Content
            aria-describedby={undefined}
            className="bg-background data-open:animate-in data-closed:animate-out fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border p-5 outline-none"
            data-llm-visible="true"
            onEscapeKeyDown={(event) => event.preventDefault()}
            onPointerDownOutside={(event) => event.preventDefault()}
          >
            <Dialog.Title
              className="text-lg font-semibold"
              data-llm-text={t('uploadingFiles', {
                count: activeUpload?.files.length ?? 0,
              })}
            >
              {t('uploadingFiles', {
                count: activeUpload?.files.length ?? 0,
              })}
            </Dialog.Title>
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span
                  className="text-muted-foreground"
                  data-llm-text={t('uploadProgress')}
                >
                  {t('uploadProgress')}
                </span>
                <span
                  className="font-medium tabular-nums"
                  data-llm-text={`${uploadProgress}%`}
                >
                  {uploadProgress}%
                </span>
              </div>
              <Progress
                className="h-2"
                value={uploadProgress}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={uploadProgress}
                aria-label={t('uploadProgress')}
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root
        open={Boolean(pageError)}
        onOpenChange={(open) => {
          if (!open) setPageError('');
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="data-open:animate-in data-closed:animate-out fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
          <AlertDialog.Content
            className="bg-background data-open:animate-in data-closed:animate-out fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border p-5 outline-none"
            data-llm-visible="true"
          >
            <AlertDialog.Title
              className="text-lg font-semibold"
              data-llm-text={t('actionFailed')}
            >
              {t('actionFailed')}
            </AlertDialog.Title>
            <AlertDialog.Description
              className="mt-2 text-sm text-muted-foreground"
              data-llm-text={pageError}
            >
              {pageError}
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end">
              <Button type="button" onClick={() => setPageError('')}>
                {t('close')}
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      <AlertDialog.Root
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="data-open:animate-in data-closed:animate-out fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
          <AlertDialog.Content
            className="bg-background data-open:animate-in data-closed:animate-out fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border p-5 outline-none"
            data-llm-visible="true"
          >
            <AlertDialog.Title
              className="text-lg font-semibold"
              data-llm-text={t('delete')}
            >
              {t('delete')}
            </AlertDialog.Title>
            <AlertDialog.Description
              className="mt-2 text-sm text-muted-foreground"
              data-llm-text={t('confirmDelete', {
                count: deleteTarget?.names.length ?? 0,
              })}
            >
              {t('confirmDelete', {
                count: deleteTarget?.names.length ?? 0,
              })}
            </AlertDialog.Description>
            {pageError && (
              <p
                className="mt-3 text-sm text-destructive"
                role="alert"
                data-llm-text={pageError}
              >
                {pageError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                {t('cancel')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleting}
                onClick={() => void confirmDelete()}
              >
                {deleting ? t('deleting') : t('delete')}
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
