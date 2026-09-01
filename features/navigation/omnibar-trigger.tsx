'use client';

import { useOmnibar } from './omnibar-provider';
import { isApplePlatform } from './omnibar-utils';
import { Kbd } from '@/shared/components/ui/kbd';
import { SidebarMenuButton } from '@/shared/components/ui/sidebar';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export default function OmnibarTrigger() {
  const t = useTranslations('omnibar');
  const { open } = useOmnibar();
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  );
  const shortcut =
    mounted && isApplePlatform() ? t('shortcutMac') : t('shortcut');

  return (
    <SidebarMenuButton
      type="button"
      tooltip={t('openLabel')}
      onClick={open}
      className="text-sidebar-foreground/80"
    >
      <Search />
      <span data-llm-text={t('placeholder')}>{t('placeholder')}</span>
      <Kbd className="ml-auto group-data-[collapsible=icon]:hidden">
        {shortcut}
      </Kbd>
    </SidebarMenuButton>
  );
}
