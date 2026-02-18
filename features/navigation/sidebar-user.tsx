import { hasPerm, hasPriv, PERM, PRIV } from '../user/lib/priv';
import avatarUrl from '@/features/user/lib/avatar-url';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/components/ui/sidebar';
import { type User } from '@/shared/types/user';
import { ChevronDown } from 'lucide-react';
import { redirect } from 'next/navigation';

export function SidebarUser({ user }: { user: User | null | undefined }) {
  if (!user?._id) {
    redirect('/login');
  }

  let modType = '用户';
  if (user) {
    if (hasPriv(user, PRIV.PRIV_MOD_BADGE)) {
      modType = '超级管理员';
    } else if (hasPerm(user, PERM.PERM_MOD_BADGE)) {
      modType = '教练';
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={avatarUrl(user.avatar)} alt={user.uname} />
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
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
