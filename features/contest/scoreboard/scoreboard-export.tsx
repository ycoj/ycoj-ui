'use client';

import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import type { ScoreboardResponse } from '@/shared/types/contest';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

type Props = { data: ScoreboardResponse };

export default function ScoreboardExport({ data }: Props) {
  const t = useTranslations('scoreboard');
  const target = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState(false);
  const [realName, setRealName] = useState(false);
  const [details, setDetails] = useState(false);
  const [busy, setBusy] = useState(false);

  async function exportImage() {
    if (!target.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(target.current, {
        backgroundColor: '#fff',
        useCORS: true,
      });
      if (!details) {
        const link = document.createElement('a');
        link.download = `${data.tdoc.title}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const zip = new JSZip();
        zip.file(
          `${data.tdoc.title}.png`,
          canvas.toDataURL('image/png').split(',')[1],
          { base64: true }
        );
        await zip.generateAsync({ type: 'blob' }).then((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${data.tdoc.title}.zip`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        });
      }
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
        {t('export')}
      </Button>
      {open && (
        <div className="absolute z-20 mt-2 space-y-3 rounded-md border bg-popover p-4 shadow-md">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={avatar}
              onCheckedChange={(v) => setAvatar(v === true)}
            />
            {t('includeAvatar')}
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={realName}
              onCheckedChange={(v) => setRealName(v === true)}
            />
            {t('useRealName')}
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={details}
              onCheckedChange={(v) => setDetails(v === true)}
            />
            {t('includeDetails')}
          </label>
          <Button size="sm" disabled={busy} onClick={exportImage}>
            {busy ? t('exporting') : t('export')}
          </Button>
        </div>
      )}
      <div
        ref={target}
        className="fixed -left-[10000px] top-0 bg-white p-8 text-black"
      >
        <h1 className="mb-4 text-2xl font-bold">{data.tdoc.title}</h1>
        <pre>
          {data.rows
            .map((row) => row.map((cell) => String(cell.value)).join('\t'))
            .join('\n')}
        </pre>
      </div>
    </>
  );
}
