import { UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function SettingsSidebar() {
  const t = useTranslations('accountSettings');

  return (
    <aside className="space-y-3 md:min-h-56" data-llm-visible="true">
      <h2
        className="text-sm font-medium text-muted-foreground"
        data-llm-text={t('navigation')}
      >
        {t('navigation')}
      </h2>
      <nav aria-label={t('navigation')}>
        <Link
          href="/home/settings/account"
          aria-current="page"
          className="flex items-center gap-2 rounded-sm bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
          data-llm-text={t('title')}
        >
          <UserRound className="size-4 shrink-0" aria-hidden="true" />
          {t('title')}
        </Link>
      </nav>
    </aside>
  );
}
