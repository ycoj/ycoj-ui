import { getProfileExtras, type UserProfileProps } from './shared';
import Markdown from '@/shared/components/markdown';
import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function BioSection({ data }: UserProfileProps) {
  const t = useTranslations('user');
  const extras = getProfileExtras(data);
  const bio = extras.bio;

  return (
    <section className="space-y-3" data-llm-visible="true">
      <h2 className="inline-flex items-center gap-2 text-base font-medium">
        <FileText className="size-4 text-muted-foreground" />
        <span data-llm-text={t('bio')}>{t('bio')}</span>
      </h2>

      {bio ? (
        <div className="overflow-hidden rounded-lg border px-4 py-3">
          <Markdown>{bio}</Markdown>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground" data-llm-text={t('noBio')}>
          {t('noBio')}
        </p>
      )}
    </section>
  );
}
