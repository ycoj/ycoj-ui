'use client';

import { serializeAnswersForSubmit } from './draft-utils';
import { useObjective } from './provider';
import ClientApis from '@/api/client/method';
import parseErrorMessage from '@/shared/components/errored/parse-message';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { dump } from 'js-yaml';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  pid: string;
  tid?: string | null;
  isGuest: boolean;
  canSubmit: boolean;
  isReadOnly: boolean;
  eventRule?: string;
};

export default function ObjectiveSubmitButton({
  pid,
  tid,
  isGuest,
  canSubmit,
  isReadOnly,
  eventRule,
}: Props) {
  const t = useTranslations('problem.objectiveForm');
  const tSubmit = useTranslations('problem.submitForm');
  const router = useRouter();
  const { answers, isReady } = useObjective();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (isReadOnly) {
    return (
      <div className="space-y-3">
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
          <AlertDescription>
            {tSubmit('contestEndedDescription')}
          </AlertDescription>
        </Alert>
        <Button asChild className="gap-2">
          <Link href={`/problem/${pid}`}>{t('openInProblemSet')}</Link>
        </Button>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button asChild className="gap-2">
          <Link href={`/login?next=/problem/${pid}${tid ? `?tid=${tid}` : ''}`}>
            {t('loginToSubmit')}
          </Link>
        </Button>
      </div>
    );
  }

  if (!canSubmit) {
    return (
      <div className="space-y-3">
        <Alert variant="destructive">
          <AlertDescription>{t('noPermission')}</AlertDescription>
        </Alert>
        <Button disabled className="gap-2">
          {t('submit')}
        </Button>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const filtered = serializeAnswersForSubmit(answers);
      const yamlCode = dump(filtered);
      const res = await ClientApis.Problem.submitProblem(
        pid,
        { lang: '_', code: yamlCode },
        tid ?? undefined
      ).send();

      if (res?.rid) {
        router.push(`/record/${res.rid}`);
        return;
      }
      if (res?.tid) {
        if (eventRule === 'homework') {
          router.push(`/homework/${res.tid}`);
        } else {
          router.push(`/contest/${res.tid}`);
        }
        return;
      }
      if (res?.error) {
        setError(parseErrorMessage(res.error));
      } else {
        setError(t('submitFailed'));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('submitRetry');
      setError(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button
        onClick={handleSubmit}
        disabled={!isReady || pending}
        className="gap-2"
        size="lg"
      >
        {pending ? t('submitting') : t('submit')}
      </Button>
    </div>
  );
}
