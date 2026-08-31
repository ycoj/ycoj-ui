import type { PasteMainData } from '@/api/server/method/paste/main';
import Pagination from '@/shared/components/pagination';
import { Badge } from '@/shared/components/ui/badge';
import { Empty, EmptyHeader, EmptyTitle } from '@/shared/components/ui/empty';
import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = { data: PasteMainData };

export default function PasteHistory({ data }: Props) {
  const t = useTranslations('paste');
  const format = useFormatter();
  return (
    <section
      className="min-w-0 space-y-4 rounded-xl border bg-card p-4"
      data-llm-visible="true"
    >
      <h2 className="text-lg font-semibold" data-llm-text={t('history')}>
        {t('history')}
      </h2>
      {!data.pdocs.length ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle data-llm-text={t('empty')}>{t('empty')}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="divide-y">
          {data.pdocs.map((paste) => {
            const title = paste.title || paste._id;
            const language = Object.hasOwn(data.languageOptions, paste.language)
              ? data.languageOptions[paste.language]
              : paste.language;
            const type =
              paste.mode === 'markdown' ? t('markdown') : language || t('code');
            const updatedAt = format.dateTime(new Date(paste.updatedAt), {
              dateStyle: 'medium',
              timeStyle: 'short',
            });
            return (
              <li key={paste._id} className="space-y-2 py-3 first:pt-0">
                <Link
                  href={`/paste/${encodeURIComponent(paste._id)}`}
                  className="block truncate font-medium hover:text-primary hover:underline"
                  title={title}
                  data-llm-text={title}
                >
                  {title}
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" data-llm-text={type}>
                    {type}
                  </Badge>
                  <time dateTime={paste.updatedAt} data-llm-text={updatedAt}>
                    {updatedAt}
                  </time>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Pagination page={data.page} totalPages={data.ppcount} />
    </section>
  );
}
