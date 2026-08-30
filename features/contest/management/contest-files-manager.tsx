'use client';

import ClientApis from '@/api/client/method';
import type { ContestManagementResponse } from '@/api/server/method/contests/management';
import FileSection from '@/features/problem/files/file-section';
import { Button } from '@/shared/components/ui/button';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { AlertDialog } from 'radix-ui';
import { useState } from 'react';
import { toast } from 'sonner';

type ContestFileType = 'public' | 'private';

type Props = {
  tid: string;
  files: ContestManagementResponse['files'];
  privateFiles: ContestManagementResponse['privateFiles'];
};

export default function ContestFilesManager({
  tid,
  files,
  privateFiles,
}: Props) {
  const t = useTranslations('contestManagement');
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: ContestFileType;
    names: string[];
  } | null>(null);

  const upload = async (type: ContestFileType, selectedFiles: File[]) => {
    if (!selectedFiles.length || uploading) return;
    setUploading(true);
    try {
      await Promise.all(
        selectedFiles.map((file) =>
          ClientApis.Contest.uploadContestFile(tid, file, type).send()
        )
      );
      toast.success(t('uploaded'));
      router.refresh();
    } catch {
      toast.error(t('actionFailed'));
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await ClientApis.Contest.deleteContestFiles(
        tid,
        deleteTarget.names,
        deleteTarget.type
      ).send();
      toast.success(t('deleted'));
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error(t('actionFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const download = (type: ContestFileType, names: string[]) => {
    for (const name of names) {
      const anchor = document.createElement('a');
      anchor.href = `/api/contest/${encodeURIComponent(tid)}/file/${type}/${encodeURIComponent(name)}`;
      anchor.download = name;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <FileSection<ContestFileType>
          key={`public-${files.map((file) => file.name).join(':')}`}
          type="public"
          title={t('publicFiles')}
          files={files}
          canManage
          canCreate={false}
          canRename={false}
          canEdit={false}
          uploading={uploading}
          deleting={deleting}
          onUpload={upload}
          onDelete={(type, names) => setDeleteTarget({ type, names })}
          onDownload={download}
        />
        <FileSection<ContestFileType>
          key={`private-${privateFiles.map((file) => file.name).join(':')}`}
          type="private"
          title={t('privateFiles')}
          files={privateFiles}
          canManage
          canCreate={false}
          canRename={false}
          canEdit={false}
          uploading={uploading}
          deleting={deleting}
          onUpload={upload}
          onDelete={(type, names) => setDeleteTarget({ type, names })}
          onDownload={download}
        />
      </div>

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
              data-llm-text={t('deleteFilesTitle')}
            >
              {t('deleteFilesTitle')}
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
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline" disabled={deleting}>
                  {t('cancel')}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleting}
                  onClick={() => void remove()}
                >
                  {deleting ? t('deleting') : t('delete')}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
