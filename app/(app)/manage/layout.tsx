import ManageSidebar from '@/features/manage/manage-sidebar';
import { getUser } from '@/features/user/lib/get-user';
import TwoColumnLayout from '@/shared/layout/two-column';

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  return (
    <TwoColumnLayout
      left={children}
      right={<ManageSidebar priv={user.priv} />}
      ratio="8-2"
      gap="gap-6"
    />
  );
}
