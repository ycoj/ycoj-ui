import { hasPerm, hasPriv, PERM, PRIV } from '../user/lib/priv';
import SidebarUserMenu from './sidebar-user-menu';
import { SidebarMenu, SidebarMenuItem } from '@/shared/components/ui/sidebar';
import { type User } from '@/shared/types/user';
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
        <SidebarUserMenu user={user} modType={modType} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
