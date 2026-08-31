import avatarUrl from '../user/lib/avatar-url';
import { hasPerm, hasPriv, PERM, PRIV } from '../user/lib/priv';
import SidebarUserMenu, { type SidebarRoleKey } from './sidebar-user-menu';
import { SidebarMenu, SidebarMenuItem } from '@/shared/components/ui/sidebar';
import { type User } from '@/shared/types/user';
import { redirect } from 'next/navigation';

function getRoleKey(user: User): SidebarRoleKey {
  if (hasPriv(user, PRIV.PRIV_MOD_BADGE)) {
    return 'superAdmin';
  }
  if (hasPerm(user, PERM.PERM_MOD_BADGE)) {
    return 'coach';
  }
  return 'user';
}

export function SidebarUser({ user }: { user: User | null | undefined }) {
  if (!user?._id) {
    redirect('/login');
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarUserMenu
          user={{ _id: user._id, uname: user.uname }}
          roleKey={getRoleKey(user)}
          avatarSrc={avatarUrl(user.avatar)}
          canUsePaste={hasPriv(user, PRIV.PRIV_USER_PROFILE)}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
