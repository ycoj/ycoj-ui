'use client';

import { useObjective } from './provider';
import ObjectiveSubmitButton from './submit-button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/components/ui/alert';
import { useTranslations } from 'next-intl';

function DraftWarning() {
  const t = useTranslations('problem.objectiveForm');
  const { draftError } = useObjective();
  if (!draftError) return null;
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertDescription>{t('draftError')}</AlertDescription>
    </Alert>
  );
}

function ConfigWarning() {
  const t = useTranslations('problem.objectiveForm');
  const { questionIds, isReady } = useObjective();
  if (!isReady) return null;
  if (questionIds.length > 0) return null;
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTitle>{t('configWarning')}</AlertTitle>
      <AlertDescription>{t('configWarning')}</AlertDescription>
    </Alert>
  );
}

export function ObjectiveStatementFooter({
  pid,
  tid,
  isGuest,
  canSubmit,
  isReadOnly,
  eventRule,
}: {
  pid: string;
  tid?: string | null;
  isGuest: boolean;
  canSubmit: boolean;
  isReadOnly: boolean;
  eventRule?: string;
}) {
  const { questionIds, isReady } = useObjective();
  if (isReady && questionIds.length === 0) return null;
  return (
    <div className="mt-8 space-y-4">
      <DraftWarning />
      <ConfigWarning />
      <ObjectiveSubmitButton
        pid={pid}
        tid={tid}
        isGuest={isGuest}
        canSubmit={canSubmit}
        isReadOnly={isReadOnly}
        eventRule={eventRule}
      />
    </div>
  );
}
