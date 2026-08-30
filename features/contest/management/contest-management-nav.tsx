'use client';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import {
  ArrowLeft,
  ClipboardList,
  FileArchive,
  MessageSquareText,
  Pencil,
  Send,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavButtonProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  nested?: boolean;
};

function NavButton({ href, icon: Icon, label, nested }: NavButtonProps) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        'h-10 w-full justify-start gap-3 px-4',
        nested && 'h-9 px-3 text-sm',
        active && 'bg-accent text-accent-foreground'
      )}
    >
      <Link href={href} aria-current={active ? 'page' : undefined}>
        <Icon className={nested ? 'size-4' : undefined} strokeWidth={2} />
        <span data-llm-text={label}>{label}</span>
      </Link>
    </Button>
  );
}

type Props = {
  tid: string;
  showReturn?: boolean;
};

export default function ContestManagementNav({
  tid,
  showReturn = false,
}: Props) {
  const t = useTranslations('contestManagement');

  return (
    <nav className="space-y-1" aria-label={t('management')}>
      {showReturn && (
        <NavButton
          href={`/contest/${tid}`}
          icon={ArrowLeft}
          label={t('view')}
        />
      )}

      <div className="rounded-lg bg-muted/50 p-1">
        <NavButton
          href={`/contest/${tid}/management`}
          icon={ClipboardList}
          label={t('management')}
        />
        <div className="ml-4 space-y-1 border-l pl-2">
          <NavButton
            href={`/contest/${tid}/user`}
            icon={Users}
            label={t('attendees')}
            nested
          />
          <NavButton
            href={`/contest/${tid}/clarification`}
            icon={MessageSquareText}
            label={t('clarifications')}
            nested
          />
          <NavButton
            href={`/contest/${tid}/balloon`}
            icon={Send}
            label={t('balloons')}
            nested
          />
          <NavButton
            href={`/contest/${tid}/bulk-submit`}
            icon={FileArchive}
            label={t('bulkSubmit')}
            nested
          />
        </div>
      </div>

      <NavButton
        href={`/contest/${tid}/edit`}
        icon={Pencil}
        label={t('edit')}
      />
    </nav>
  );
}
