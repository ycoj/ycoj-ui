'use client';

import { Button } from '@/shared/components/ui/button';
import { useClipboardCopy } from '@/shared/hooks/use-clipboard-copy';
import { Check, Code2, Link2, Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = { id: string; canManage: boolean };

export default function PasteDetailActions({ id, canManage }: Props) {
  const t = useTranslations('paste');
  const href = `/paste/${encodeURIComponent(id)}`;
  const { copied, onCopy } = useClipboardCopy(
    () => new URL(href, window.location.origin).href
  );
  return (
    <div className="flex flex-wrap gap-2" data-llm-visible="true">
      <Button variant="outline" onClick={() => void onCopy()}>
        {copied ? <Check /> : <Link2 />}
        <span data-llm-text={copied ? t('copied') : t('copyLink')}>
          {copied ? t('copied') : t('copyLink')}
        </span>
      </Button>
      <Button variant="outline" asChild>
        <Link
          href={`${href}/raw`}
          target="_blank"
          rel="noopener noreferrer"
          prefetch={false}
        >
          <Code2 />
          {t('raw')}
        </Link>
      </Button>
      {canManage && (
        <Button variant="outline" asChild>
          <Link href={`${href}/edit`}>
            <Pencil />
            {t('edit')}
          </Link>
        </Button>
      )}
    </div>
  );
}
