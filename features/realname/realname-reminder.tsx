import { getRealnameAccess } from './lib/realname-access';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/components/ui/alert';
import type { User } from '@/shared/types/user';
import { CircleAlert, Clock3 } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';

type Props = {
  user: User;
};

export default async function RealnameReminder({ user }: Props) {
  const access = getRealnameAccess(user);
  if (!access.inGrace || !access.graceUntil) return null;

  const [t, locale] = await Promise.all([
    getTranslations('realname.reminder'),
    getLocale(),
  ]);
  const deadline = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(access.graceUntil);
  const rejected = access.status === 'rejected';
  const title = t(rejected ? 'rejectedTitle' : 'pendingTitle');
  const description = t(
    rejected ? 'rejectedDescription' : 'pendingDescription',
    {
      deadline,
    }
  );

  return (
    <Alert
      variant={rejected ? 'destructive' : 'default'}
      className="mb-4"
      data-llm-visible="true"
    >
      {rejected ? <CircleAlert /> : <Clock3 />}
      <AlertTitle data-llm-text={title}>{title}</AlertTitle>
      <AlertDescription data-llm-text={description}>
        {description}{' '}
        <Link href={rejected ? '/home/realname' : '/home/realname/result'}>
          {t(rejected ? 'resubmit' : 'viewStatus')}
        </Link>
      </AlertDescription>
    </Alert>
  );
}
