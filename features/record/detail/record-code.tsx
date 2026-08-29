'use client';

import CodeRenderer from '@/shared/components/code/code-renderer';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { getSyntaxLanguage } from '@/shared/lib/code-language';
import type { RecordDoc } from '@/shared/types/record';
import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

type Props = {
  rdoc: RecordDoc;
};

export default function RecordCode({ rdoc }: Props) {
  const t = useTranslations('common');
  const [copied, setCopied] = useState(false);

  const code = rdoc.code;

  const onCopy = useCallback(async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }, [code]);

  if (!code || !rdoc.lang) {
    return null;
  }

  return (
    <Card className="relative">
      <Button
        variant="ghost"
        type="button"
        className="bg-card border-border absolute top-0 right-0 z-10 h-auto cursor-pointer gap-1.5 rounded-none rounded-tr-xl rounded-bl-md border-t-0 border-r-0 border-b border-l px-3 py-1.5 leading-none"
        onClick={() => void onCopy()}
      >
        {copied ? <Check /> : <Copy />}
        <span className="inline-flex h-3.5 items-center leading-none">
          {copied ? t('copied') : t('copy')}
        </span>
      </Button>
      <CardContent className="text-base">
        <CodeRenderer code={code} language={getSyntaxLanguage(rdoc.lang)} />
      </CardContent>
    </Card>
  );
}
