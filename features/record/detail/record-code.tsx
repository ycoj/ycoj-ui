'use client';

import CodeRenderer from '@/shared/components/code/code-renderer';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
} from '@/shared/components/ui/card';
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
    <Card>
      <CardHeader>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="cursor-pointer"
            onClick={() => void onCopy()}
          >
            {copied ? <Check /> : <Copy />}
            {copied ? t('copied') : t('copy')}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="text-base">
        <CodeRenderer code={code} language={getSyntaxLanguage(rdoc.lang)} />
      </CardContent>
    </Card>
  );
}
