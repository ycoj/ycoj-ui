'use client';

import { SUDO_REQUIRED_EVENT } from '@/shared/lib/sudo-navigation';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SudoRedirectListener() {
  const router = useRouter();
  useEffect(() => {
    const navigate = () => router.push('/user/sudo');
    window.addEventListener(SUDO_REQUIRED_EVENT, navigate);
    return () => window.removeEventListener(SUDO_REQUIRED_EVENT, navigate);
  }, [router]);
  return null;
}
