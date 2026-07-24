import Markdown from '@/shared/components/markdown';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Megaphone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export type Props = {
  bulletin?: string;
};

export default async function Bulletin({ bulletin }: Props) {
  const t = await getTranslations('homepage');
  if (!bulletin) return null;

  return (
    <Card data-llm-visible="true">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="size-5" />
          <span data-llm-text={t('bulletin')}>{t('bulletin')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Markdown>{bulletin}</Markdown>
      </CardContent>
    </Card>
  );
}
