import { pasteLanguageLabel } from '@/features/paste/paste-language';
import Pagination from '@/shared/components/pagination';
import { Badge } from '@/shared/components/ui/badge';
import { Empty, EmptyHeader, EmptyTitle } from '@/shared/components/ui/empty';
import type { PasteDoc } from '@/shared/types/paste';
import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = {
  pdocs: PasteDoc[];
  page: number;
  ppcount: number;
  languageNames: Record<string, string>;
};

export default function PasteHistory({
  pdocs,
  page,
  ppcount,
  languageNames,
}: Props) {
  const t = useTranslations('paste');
  const format = useFormatter();
  return (
    <section
      className="min-w-0 space-y-2 rounded-xl border bg-card p-3"
      aria-label={t('history')}
      data-llm-visible="true"
    >
      {!pdocs.length ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle data-llm-text={t('empty')}>{t('empty')}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="divide-y">
          {pdocs.map((paste) => {
            const title = paste.title || paste._id;
            const type =
              paste.mode === 'markdown'
                ? t('markdown')
                : pasteLanguageLabel(paste.language, languageNames, t('code'));
            const updatedAt = format.dateTime(new Date(paste.updatedAt), {
              dateStyle: 'medium',
              timeStyle: 'short',
            });
            return (
              <li
                key={paste._id}
                className="flex items-center gap-2 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/paste/${encodeURIComponent(paste._id)}`}
                    className="block truncate text-sm font-medium hover:text-primary hover:underline"
                    title={title}
                    data-llm-text={title}
                  >
                    {title}
                  </Link>
                  <time
                    className="block text-xs text-muted-foreground"
                    dateTime={paste.updatedAt}
                    data-llm-text={updatedAt}
                  >
                    {updatedAt}
                  </time>
                </div>
                <Badge variant="secondary" data-llm-text={type}>
                  {type}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
      <Pagination page={page} totalPages={ppcount} />
    </section>
  );
}
