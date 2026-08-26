'use client';

import { useObjective } from '@/features/problem/objective/provider';
import ObjectiveSubmitButton from '@/features/problem/objective/submit-button';

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
