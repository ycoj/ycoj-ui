'use client';

import ClientApis from '@/api/client/method';
import { Button } from '@/shared/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  tid: string;
};

export default function UnlockButton({ tid }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    setLoading(true);
    try {
      await ClientApis.Contest.unlockScoreboard(tid);
      router.refresh();
    } catch {
      // silently handle — toast can be added later
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleUnlock}
      disabled={loading}
    >
      {loading ? '解锁中...' : '解锁成绩表'}
    </Button>
  );
}
