'use client';

import { isEditableFile } from './editable-file';
import { formatFileSize } from './format-file-size';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import type { FileInfo } from '@/shared/types/file';
import type { ProblemFileType } from '@/shared/types/problem-file';
import { Download, FilePlus2, FileUp, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

type Props = {
  type: ProblemFileType;
  files: FileInfo[];
  canManage: boolean;
  canDownload?: boolean;
  uploading: boolean;
  deleting: boolean;
  onCreate: (type: ProblemFileType) => void;
  onUpload: (type: ProblemFileType, file: File) => Promise<void>;
  onRename: (type: ProblemFileType, file: FileInfo) => void;
  onEdit: (type: ProblemFileType, file: FileInfo) => void;
  onDelete: (type: ProblemFileType, names: string[]) => void;
  onDownload: (type: ProblemFileType, names: string[]) => void;
};

export default function FileSection({
  type,
  files,
  canManage,
  canDownload = true,
  uploading,
  deleting,
  onCreate,
  onUpload,
  onRename,
  onEdit,
  onDelete,
  onDownload,
}: Props) {
  const t = useTranslations('problem.fileManager');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const title = type === 'testdata' ? t('testdata') : t('additionalFiles');

  const toggle = (name: string, checked: boolean) => {
    setSelected((current) =>
      checked
        ? [...new Set([...current, name])]
        : current.filter((item) => item !== name)
    );
  };
  const allSelected = files.length > 0 && selected.length === files.length;

  const upload = async (file?: File) => {
    if (!file) return;
    try {
      await onUpload(type, file);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <section className="overflow-hidden" data-llm-visible="true">
      <div className="flex flex-wrap items-center justify-between gap-3 py-3">
        <h2 className="text-xl text-primary" data-llm-text={title}>
          {title}
        </h2>
        <div className="flex flex-wrap gap-2">
          {canManage && (
            <>
              <Button type="button" size="sm" onClick={() => onCreate(type)}>
                <FilePlus2 />
                <span data-llm-text={t('createFile')}>{t('createFile')}</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                <FileUp />
                <span data-llm-text={t('uploadFile')}>{t('uploadFile')}</span>
              </Button>
              <Input
                ref={inputRef}
                type="file"
                className="hidden"
                aria-label={t('uploadFile')}
                disabled={uploading}
                onChange={(event) => void upload(event.target.files?.[0])}
              />
            </>
          )}
        </div>
      </div>

      {files.length ? (
        <>
          <div className="grid grid-cols-[2rem_minmax(0,1fr)_7rem_7rem] items-center gap-3 border-y px-3 py-2 text-sm text-muted-foreground">
            <Checkbox
              checked={allSelected}
              aria-label={t('selectAll')}
              onCheckedChange={(checked) =>
                setSelected(
                  checked === true ? files.map((file) => file.name) : []
                )
              }
            />
            <span>{t('filename')}</span>
            <span>{t('size')}</span>
            <span className="sr-only">{t('actions')}</span>
          </div>
          <ul>
            {files.map((file) => {
              const checked = selected.includes(file.name);
              const editable = canManage && isEditableFile(file.name);
              return (
                <li
                  key={file.name}
                  className="grid grid-cols-[2rem_minmax(0,1fr)_7rem_7rem] items-center gap-3 border-b px-3 py-3 text-sm odd:bg-muted/30"
                >
                  <Checkbox
                    checked={checked}
                    aria-label={t('selectFile', { name: file.name })}
                    onCheckedChange={(value) =>
                      toggle(file.name, value === true)
                    }
                  />
                  {editable ? (
                    <button
                      type="button"
                      className="min-w-0 cursor-pointer truncate text-left font-mono hover:text-primary hover:underline"
                      title={t('editFile')}
                      data-llm-text={file.name}
                      onClick={() => onEdit(type, file)}
                    >
                      {file.name}
                    </button>
                  ) : (
                    <span
                      className="min-w-0 truncate font-mono"
                      title={file.name}
                      data-llm-text={file.name}
                    >
                      {file.name}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                  <div className="flex items-center justify-end gap-1">
                    {canDownload && (
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        title={t('download')}
                        aria-label={t('download')}
                        onClick={() => onDownload(type, [file.name])}
                      >
                        <Download />
                      </Button>
                    )}
                    {canManage && (
                      <>
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="ghost"
                          title={t('rename')}
                          aria-label={t('rename')}
                          onClick={() => onRename(type, file)}
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
                          disabled={deleting}
                          onClick={() => onDelete(type, [file.name])}
                        >
                          <Trash2 />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap gap-2 border-b px-3 py-4">
            {canDownload && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!selected.length}
                onClick={() => onDownload(type, selected)}
              >
                <Download />
                <span>{t('downloadSelected')}</span>
              </Button>
            )}
            {canManage && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!selected.length || deleting}
                onClick={() => onDelete(type, selected)}
              >
                <Trash2 />
                <span>{t('removeSelected')}</span>
              </Button>
            )}
          </div>
        </>
      ) : (
        <div
          className="flex min-h-40 items-center justify-center border-y px-3 py-10 text-sm text-muted-foreground"
          data-llm-text={t('empty')}
        >
          {t('empty')}
        </div>
      )}
    </section>
  );
}
