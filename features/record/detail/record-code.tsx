'use client';

import CodeCopyButton from '@/shared/components/code/code-copy-button';
import CodeRenderer from '@/shared/components/code/code-renderer';
import { Card, CardContent } from '@/shared/components/ui/card';
import { getSyntaxLanguage } from '@/shared/lib/code-language';
import type { RecordDoc } from '@/shared/types/record';

type Props = {
  rdoc: RecordDoc;
};

export default function RecordCode({ rdoc }: Props) {
  const code = rdoc.code;

  if (!code || !rdoc.lang) {
    return null;
  }

  return (
    <Card className="relative">
      <CodeCopyButton text={code} />
      <CardContent className="text-base">
        <CodeRenderer code={code} language={getSyntaxLanguage(rdoc.lang)} />
      </CardContent>
    </Card>
  );
}
