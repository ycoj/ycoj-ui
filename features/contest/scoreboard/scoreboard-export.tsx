'use client';

import { exportFilename } from './scoreboard-export-utils';
import ClientApis from '@/api/client/method';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog } from 'radix-ui';
import { useState } from 'react';

type Props = {
  title: string;
  canExportPrivate: boolean;
  tid: string;
  pageType: 'contest' | 'homework';
};

export default function ScoreboardExport({
  title,
  canExportPrivate,
  tid,
  pageType,
}: Props) {
  const t = useTranslations('scoreboard');
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState(false);
  const [realName, setRealName] = useState(false);
  const [details, setDetails] = useState(false);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState(false);
  async function exportImage() {
    setOpen(false);
    setBusy(true);
    setError(false);
    try {
      const blob = await ClientApis.Contest.downloadScoreboard(pageType, tid, {
        avatar,
        realName,
        details,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${exportFilename(title)}.${details ? 'zip' : 'png'}`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setOpen(false);
    } catch {
      setError(true);
      setOpen(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled={busy}>
            {t('export')}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-max space-y-3 p-4">
          <label className="flex items-center gap-2">
            <Checkbox
              disabled={busy}
              checked={avatar}
              onCheckedChange={(v) => setAvatar(v === true)}
            />
            {t('includeAvatar')}
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              disabled={busy || !canExportPrivate}
              checked={realName}
              onCheckedChange={(v) => setRealName(v === true)}
            />
            {t('useRealName')}
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              disabled={busy || !canExportPrivate}
              checked={details}
              onCheckedChange={(v) => setDetails(v === true)}
            />
            {t('includeDetails')}
          </label>
          {error && <p role="alert">{t('exportFailed')}</p>}
          <Button size="sm" disabled={busy} onClick={exportImage}>
            {busy ? t('exporting') : t('export')}
          </Button>
        </PopoverContent>
      </Popover>
      <Dialog.Root open={busy}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
          <Dialog.Content
            className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 outline-none"
            onEscapeKeyDown={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <Dialog.Title className="flex items-center gap-2 text-lg font-semibold">
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin"
              />
              {t('exporting')}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              {t('exportingDescription')}
            </Dialog.Description>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
