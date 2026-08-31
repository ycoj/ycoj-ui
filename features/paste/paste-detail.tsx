import type { PasteDetailData } from '@/api/server/method/paste/detail';
import PasteContent from '@/features/paste/paste-content';
import PasteDetailActions from '@/features/paste/paste-detail-actions';
import { pasteLanguageLabel } from '@/features/paste/paste-language';
import { getFormatter, getTranslations } from 'next-intl/server';

type Props = { data: PasteDetailData };

export default async function PasteDetail({ data }: Props) {
  const [t, format] = await Promise.all([
    getTranslations('paste'),
    getFormatter(),
  ]);
  const { pdoc: paste, canManage, languageNames: languageOptions } = data;
  const title = paste.title || t('name');
  const language = pasteLanguageLabel(
    paste.language,
    languageOptions,
    t('plainText')
  );
  const expiry = paste.expireAt
    ? format.dateTime(new Date(paste.expireAt), {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : t('expiry.never');
  return (
    <article className="min-w-0 space-y-5" data-llm-visible="true">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1
          className="min-w-0 text-2xl font-semibold break-words"
          data-llm-text={title}
        >
          {title}
        </h1>
        <PasteDetailActions id={paste._id} canManage={canManage} />
      </div>
      <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <div className="flex gap-2">
          <dt>{t('type')}</dt>
          <dd data-llm-text={t(paste.mode)}>{t(paste.mode)}</dd>
        </div>
        {paste.mode === 'code' && (
          <div className="flex gap-2">
            <dt>{t('language')}</dt>
            <dd data-llm-text={language}>{language}</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt>{t('expires')}</dt>
          <dd data-llm-text={expiry}>
            {paste.expireAt ? (
              <time dateTime={paste.expireAt}>{expiry}</time>
            ) : (
              expiry
            )}
          </dd>
        </div>
      </dl>
      <PasteContent paste={paste} />
    </article>
  );
}
