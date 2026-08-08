'use client';

import CreateFileDialog from './create-file-dialog';
import FileSection from './file-section';
import RenameFileDialog from './rename-file-dialog';
import ClientApis from '@/api/client/method';
import { Button } from '@/shared/components/ui/button';
import type { FileInfo } from '@/shared/types/file';
import type { ProblemFileType } from '@/shared/types/problem-file';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { AlertDialog } from 'radix-ui';
import { useState } from 'react';

type Props = {
  pid: string;
  tid?: string;
  testdata: FileInfo[];
  additionalFiles: FileInfo[];
  canManage: boolean;
};

type RenameTarget = {
  type: ProblemFileType;
  file: FileInfo;
};

export default function ProblemFilesManager({
  pid,
  tid,
  testdata,
  additionalFiles,
  canManage,
}: Props) {
  const t = useTranslations('problem.fileManager');
  const router = useRouter();
  const [createType, setCreateType] = useState<ProblemFileType | null>(null);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: ProblemFileType;
    names: string[];
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pageError, setPageError] = useState('');

  const openCreate = (type: ProblemFileType) => setCreateType(type);
  const openRename = (type: ProblemFileType, file: FileInfo) =>
    setRenameTarget({ type, file });

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
      Object.entries(data.links ?? {}).forEach(([name, url]) => {
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

  const uploadFile = async (type: ProblemFileType, file: File) => {
    setUploading(true);
    setPageError('');
    try {
      await ClientApis.Problem.uploadProblemFile(
        pid,
        file,
        type,
        undefined,
        tid
      ).send();
      router.refresh();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setUploading(false);
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
        <FileSection
          key={`testdata-${testdata.map((file) => file.name).join(':')}`}
          type="testdata"
          files={testdata}
          canManage={canManage}
          uploading={uploading}
          deleting={deleting}
          onCreate={openCreate}
          onUpload={uploadFile}
          onRename={openRename}
          onDelete={deleteFiles}
          onDownload={downloadFiles}
        />
        <FileSection
          key={`additional-${additionalFiles.map((file) => file.name).join(':')}`}
          type="additional_file"
          files={additionalFiles}
          canManage={canManage}
          uploading={uploading}
          deleting={deleting}
          onCreate={openCreate}
          onUpload={uploadFile}
          onRename={openRename}
          onDelete={deleteFiles}
          onDownload={downloadFiles}
        />
      </div>

      <CreateFileDialog
        key={createType ? `create:${createType}` : 'create:closed'}
        pid={pid}
        tid={tid}
        type={createType}
        onOpenChange={(open) => !open && setCreateType(null)}
        onSaved={() => router.refresh()}
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
      />

      <AlertDialog.Root
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="data-open:animate-in data-closed:animate-out fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
          <AlertDialog.Content
            aria-describedby={undefined}
            className="bg-background data-open:animate-in data-closed:animate-out fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border p-5 outline-none [&_[data-slot=button]:not(:disabled)]:cursor-pointer"
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
