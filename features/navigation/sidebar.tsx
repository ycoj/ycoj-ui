import { SidebarUser } from './sidebar-user';
import { type NavItem } from '@/api/server/method/ui/nav';
import { getNavInfos } from '@/features/user/lib/get-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/shared/components/ui/sidebar';
import {
  Award,
  MessageCircle,
  Clipboard,
  Code2,
  Dumbbell,
  Globe,
  Home,
  Radio,
  Notebook,
  PlayCircle,
  Trophy,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';

const NAV_ROUTE_MAP: Record<string, string> = {
  homepage: '/home',
  problem_main: '/problem',
  training_main: '/training',
  contest_main: '/contest',
  homework_main: '/homework',
  discussion_main: '/discussion',
  record_main: '/record',
  ranking: '/ranking',
  domain_dashboard: '/domain',
  manage_dashboard: '/manage',
  course_list: '/course',
  live_main: '/live',
};

const NAV_ICON_MAP: Record<string, LucideIcon> = {
  homepage: Home,
  problem_main: Code2,
  training_main: Dumbbell,
  contest_main: Award,
  homework_main: Notebook,
  discussion_main: MessageCircle,
  record_main: Clipboard,
  ranking: Trophy,
  domain_dashboard: Globe,
  manage_dashboard: Settings,
  course_list: PlayCircle,
  live_main: Radio,
};

const buildHref = (item: NavItem) => {
  const base =
    NAV_ROUTE_MAP[item.name] ??
    (item.args.prefix ? `/${item.args.prefix}` : '/');
  const query =
    item.args.query && typeof item.args.query === 'object'
      ? new URLSearchParams(
          Object.entries(item.args.query).reduce<Record<string, string>>(
            (acc, [key, value]) => {
              if (value === undefined || value === null) return acc;
              acc[key] = String(value);
              return acc;
            },
            {}
          )
        ).toString()
      : '';
  return query ? `${base}?${query}` : base;
};

export default async function AppSidebar() {
  const t = await getTranslations('common');
  const misc = await getTranslations('misc');
  const siteName = process.env.SITE_NAME ?? '';
  const data = await getNavInfos();
  const items = data.navItems ?? [];
  const user = data.user;

  return (
    <Sidebar variant="inset" id="sidebar">
      <SidebarHeader className="mt-1">
        <div className="flex items-center justify-between">
          <Image
            width={100}
            height={27}
            src="/nav-logo-small_light.png"
            alt={misc('logoAlt', { siteName })}
          />
          <SidebarTrigger className="opacity-60" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu id="sidebar-nav" className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <Link href={buildHref(item)}>
                      <span className="flex items-center gap-2">
                        {NAV_ICON_MAP[item.name] &&
                          (() => {
                            const Icon = NAV_ICON_MAP[item.name];
                            return <Icon strokeWidth={2} />;
                          })()}
                        <span>
                          {(
                            {
                              homepage: t('home'),
                              problem_main: t('problem'),
                              training_main: t('training'),
                              contest_main: t('contest'),
                              homework_main: t('homework'),
                              discussion_main: t('discussion'),
                              record_main: t('record'),
                              ranking: t('ranking'),
                              domain_dashboard: t('management'),
                              manage_dashboard: t('settings'),
                              course_list: t('course'),
                              live_main: t('live'),
                            } as Record<string, string>
                          )[item.name] ??
                            item.args.displayName ??
                            item.name}
                        </span>
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
