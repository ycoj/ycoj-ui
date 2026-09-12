'use client';

import { exportFilename } from './scoreboard-export-utils';
import ClientApis from '@/api/client/method';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useTranslations } from 'next-intl';
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
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => setOpen(!open)}
      >
        {t('export')}
      </Button>
      {open && (
        <div className="absolute z-20 mt-2 space-y-3 rounded-md border bg-popover p-4 shadow-md">
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
        </div>
      )}
    </>
  );
}
