import CodeRenderer from '@/shared/components/code/code-renderer';
import { Card, CardContent } from '@/shared/components/ui/card';
import { RecordDoc } from '@/shared/types/record';

type Props = {
  rdoc: RecordDoc;
};

const LanguageMap = {
  cc: 'cpp',
} as Record<string, string>;

export default function RecordCode({ rdoc }: Props) {
  if (!rdoc.code || !rdoc.lang) {
    return null;
  }

  const lang = rdoc.lang.includes('.') ? rdoc.lang.split('.')[0] : rdoc.lang;
  return (
    <Card>
      <CardContent className="text-base">
        <CodeRenderer code={rdoc.code} language={LanguageMap[lang] || lang} />
      </CardContent>
    </Card>
  );
}
