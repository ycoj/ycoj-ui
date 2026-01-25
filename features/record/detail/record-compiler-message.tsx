'use client';

import { Card, CardContent } from '@/shared/components/ui/card';
import { RecordDoc } from '@/shared/types/record';
import { AnsiUp } from 'ansi_up';
import { useMemo } from 'react';

export function RecordCompilerMessage({ rdoc }: { rdoc: RecordDoc }) {
  const text = rdoc.compilerTexts?.join('\n');
  const html = useMemo(() => {
    if (!text || !text.length) return '';
    const au = new AnsiUp();
    au.escape_html = true;
    return au.ansi_to_html(text);
  }, [text]);

  if (!rdoc.compilerTexts?.length) return null;

  return (
    <Card data-llm-visible="true">
      <CardContent>
        <pre>
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </CardContent>
    </Card>
  );
}
