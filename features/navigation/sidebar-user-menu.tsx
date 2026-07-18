'use client';

import { locales, type Locale } from '@/i18n/config';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { SidebarMenuButton } from '@/shared/components/ui/sidebar';
import { cn } from '@/shared/lib/utils';
import type { User } from '@/shared/types/user';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Languages,
  UserRound,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';

type Props = {
  user: Pick<User, '_id' | 'uname'>;
  modType: string;
  avatarSrc: string;
};

const menuContentClassName =
  'bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 z-50 min-w-44 rounded-lg p-1 shadow-md ring-1 duration-100 outline-hidden';

const menuItemClassName =
  'focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';

export default function SidebarUserMenu({ user, modType, avatarSrc }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations('common');
  const router = useRouter();

  const changeLocale = (value: string) => {
    if (!locales.includes(value as Locale)) return;
    document.cookie = `NEXT_LOCALE=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  };

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          aria-label={user.uname}
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={avatarSrc} alt={user.uname} />
            <AvatarFallback className="rounded-lg">
              {user.uname.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{user.uname}</span>
            <span className="truncate text-xs text-muted-foreground">
              {modType}
            </span>
          </div>
          <ChevronDown className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          side="top"
          sideOffset={4}
          className={cn(
            menuContentClassName,
            'w-(--radix-dropdown-menu-trigger-width)'
          )}
          data-llm-visible="true"
        >
          <DropdownMenuPrimitive.Item asChild className={menuItemClassName}>
            <Link href={`/user/${user._id}`}>
              <UserRound aria-hidden="true" />
              <span data-llm-text={t('profile')}>{t('profile')}</span>
            </Link>
          </DropdownMenuPrimitive.Item>
          <DropdownMenuPrimitive.Sub>
            <DropdownMenuPrimitive.SubTrigger className={menuItemClassName}>
              <Languages aria-hidden="true" />
              <span data-llm-text={t('language')}>{t('language')}</span>
              <ChevronRight className="ml-auto" aria-hidden="true" />
            </DropdownMenuPrimitive.SubTrigger>
            <DropdownMenuPrimitive.Portal>
              <DropdownMenuPrimitive.SubContent
                sideOffset={4}
                className={menuContentClassName}
              >
                <DropdownMenuPrimitive.RadioGroup
                  value={locale}
                  onValueChange={changeLocale}
                >
                  <LanguageItem value="zh" label={t('chinese')} />
                  <LanguageItem value="en" label={t('english')} />
                </DropdownMenuPrimitive.RadioGroup>
              </DropdownMenuPrimitive.SubContent>
            </DropdownMenuPrimitive.Portal>
          </DropdownMenuPrimitive.Sub>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

function LanguageItem({ value, label }: { value: Locale; label: string }) {
  return (
    <DropdownMenuPrimitive.RadioItem
      value={value}
      className={cn(menuItemClassName, 'pr-8')}
    >
      <span data-llm-text={label}>{label}</span>
      <DropdownMenuPrimitive.ItemIndicator className="absolute right-2">
        <Check aria-hidden="true" />
      </DropdownMenuPrimitive.ItemIndicator>
    </DropdownMenuPrimitive.RadioItem>
  );
}
