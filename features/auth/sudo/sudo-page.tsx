'use client';

import { resumeSudo } from './resume-sudo';
import SudoConfirmation from './sudo-confirmation';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import type { SudoCapabilities, SudoResult } from '@/shared/types/sudo';
import { CircleAlert, House, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

type Props = { capabilities: SudoCapabilities; available: boolean };

export default function SudoPage({ capabilities, available }: Props) {
  const t = useTranslations('sudo');
  const router = useRouter();
  const resumed = useRef(false);
  const [phase, setPhase] = useState<'verify' | 'resuming' | 'failed'>(
    'verify'
  );
  const [error, setError] = useState('');
  const complete = async (response: SudoResult) => {
    if (resumed.current) return;
    resumed.current = true;
    setPhase('resuming');
    try {
      const target = await resumeSudo(
        response,
        window.location.origin,
        t('resumeFailed')
      );
      router.replace(target);
      router.refresh();
    } catch {
      setError(t('resumeFailed'));
      setPhase('failed');
    }
  };

  return (
    <main
      className="flex min-h-dvh items-center justify-center p-4"
      data-llm-visible="true"
    >
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>
            <h1 className="flex items-center gap-2" data-llm-text={t('title')}>
              <ShieldCheck
                className="size-6 shrink-0 text-primary"
                aria-hidden="true"
              />
              {t('title')}
            </h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!available ? (
            <div className="space-y-4">
              <p
                className="flex items-start gap-2"
                role="alert"
                data-llm-text={t('unavailable')}
              >
                <CircleAlert
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                {t('unavailable')}
              </p>
              <Button asChild variant="secondary">
                <Link href="/home">
                  <House aria-hidden="true" />
                  {t('backHome')}
                </Link>
              </Button>
            </div>
          ) : phase === 'verify' ? (
            <SudoConfirmation
              capabilities={capabilities}
              onVerified={complete}
              onCancel={() => router.replace('/home')}
            />
          ) : phase === 'resuming' ? (
            <p
              className="flex items-start gap-2"
              role="status"
              data-llm-text={t('resuming')}
            >
              <LoaderCircle
                className="mt-0.5 size-5 shrink-0 animate-spin"
                aria-hidden="true"
              />
              {t('resuming')}
            </p>
          ) : (
            <div className="space-y-4">
              <p
                className="flex items-start gap-2 text-destructive"
                role="alert"
                data-llm-text={error}
              >
                <CircleAlert
                  className="mt-0.5 size-5 shrink-0"
                  aria-hidden="true"
                />
                {error}
              </p>
              <Button asChild variant="secondary">
                <Link href="/home">
                  <House aria-hidden="true" />
                  {t('backHome')}
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
