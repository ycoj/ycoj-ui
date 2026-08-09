import CodeRenderer from '@/shared/components/code/code-renderer';
import { Card, CardContent } from '@/shared/components/ui/card';
import { getSyntaxLanguage } from '@/shared/lib/code-language';
import { RecordDoc } from '@/shared/types/record';

type Props = {
  rdoc: RecordDoc;
};

export default function RecordCode({ rdoc }: Props) {
  if (!rdoc.code || !rdoc.lang) {
    return null;
  }

  return (
    <Card>
      <CardContent className="text-base">
        <CodeRenderer
          code={rdoc.code}
          language={getSyntaxLanguage(rdoc.lang)}
        />
      </CardContent>
    </Card>
  );
}
