'use client';

import { canManageExpiration } from './manage-access';
import { PRIV } from '@/features/user/lib/priv';
import { cn } from '@/shared/lib/utils';
import { CalendarClock, UserCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ManageSidebar({ priv }: { priv: number }) {
  const t = useTranslations('manage');
  const pathname = usePathname();
  const items = [
    ...(priv === PRIV.PRIV_ALL
      ? [{ href: '/manage/realname', label: t('realname'), icon: UserCheck }]
      : []),
    ...(canManageExpiration({ priv })
      ? [
          {
            href: '/manage/user-expiration',
            label: t('expiration'),
            icon: CalendarClock,
          },
        ]
      : []),
  ];
  return (
    <aside className="space-y-3 md:sticky md:top-4" data-llm-visible="true">
      <h2 className="text-sm font-semibold" data-llm-text={t('navigation')}>
        {t('navigation')}
      </h2>
      <nav
        aria-label={t('navigation')}
        className="flex flex-col gap-1"
        data-llm-visible="true"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            aria-current={pathname === item.href ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent',
              pathname === item.href && 'bg-accent text-accent-foreground'
            )}
            data-llm-text={item.label}
          >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
