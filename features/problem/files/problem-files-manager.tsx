'use client';

import CreateFileDialog from './create-file-dialog';
import FileSection from './file-section';
import RenameFileDialog from './rename-file-dialog';
import ClientApis from '@/api/client/method';
import type { FileInfo } from '@/shared/types/file';
import type { ProblemFileType } from '@/shared/types/problem-file';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
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
  const [pageError, setPageError] = useState('');

  const openCreate = (type: ProblemFileType) => setCreateType(type);
  const openRename = (type: ProblemFileType, file: FileInfo) =>
    setRenameTarget({ type, file });

  const deleteFiles = async (type: ProblemFileType, names: string[]) => {
    if (!names.length || !window.confirm(t('confirmDelete'))) return;
    setPageError('');
    try {
      await ClientApis.Problem.deleteProblemFiles(pid, names, type, tid).send();
      router.refresh();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : t('actionFailed'));
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
      Object.values(data.links ?? {}).forEach((url) => {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.click();
      });
    } catch (err) {
      setPageError(err instanceof Error ? err.message : t('actionFailed'));
    }
  };

  const uploadFile = async (type: ProblemFileType, file: File) => {
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
    </div>
  );
}
