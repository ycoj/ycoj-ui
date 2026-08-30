import AppFrame from '@/features/navigation/app-frame';
import { getNavInfos } from '@/features/user/lib/get-user';
import { redirect } from 'next/navigation';

export default async function RealnameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = await getNavInfos();
  if (!nav.user?._id) redirect('/login');

  return <AppFrame>{children}</AppFrame>;
}
