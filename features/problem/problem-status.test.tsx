import ProblemStatus from './problem-status';
import messages from '@/messages/en.json';
import { STATUS } from '@/shared/configs/status';
import type { ProblemStatus as ProblemStatusDoc } from '@/shared/types/problem';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

function makeStatusDoc(status?: number): ProblemStatusDoc {
  return {
    _id: 'r'.repeat(24),
    docId: 1,
    docType: 10,
    domainId: 'system',
    status,
  };
}

function renderStatus(status?: number) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProblemStatus status={makeStatusDoc(status)} />
    </NextIntlClientProvider>
  );
}

const ICON_CASES: Array<[number, string]> = [
  [STATUS.STATUS_WAITING, 'lucide-clock'],
  [STATUS.STATUS_ACCEPTED, 'lucide-circle-check'],
  [STATUS.STATUS_WRONG_ANSWER, 'lucide-circle-x'],
  [STATUS.STATUS_TIME_LIMIT_EXCEEDED, 'lucide-timer'],
  [STATUS.STATUS_MEMORY_LIMIT_EXCEEDED, 'lucide-memory-stick'],
  [STATUS.STATUS_OUTPUT_LIMIT_EXCEEDED, 'lucide-file-output'],
  [STATUS.STATUS_RUNTIME_ERROR, 'lucide-bug'],
  [STATUS.STATUS_COMPILE_ERROR, 'lucide-file-exclamation-point'],
  [STATUS.STATUS_SYSTEM_ERROR, 'lucide-server-crash'],
  [STATUS.STATUS_CANCELED, 'lucide-ban'],
  [STATUS.STATUS_ETC, 'lucide-circle-question-mark'],
  [STATUS.STATUS_HACKED, 'lucide-skull'],
  [STATUS.STATUS_JUDGING, 'lucide-loader-circle'],
  [STATUS.STATUS_COMPILING, 'lucide-loader-circle'],
  [STATUS.STATUS_FETCHED, 'lucide-loader-circle'],
  [STATUS.STATUS_IGNORED, 'lucide-circle-slash'],
  [STATUS.STATUS_FORMAT_ERROR, 'lucide-align-start-vertical'],
  [STATUS.STATUS_HACK_SUCCESSFUL, 'lucide-swords'],
  [STATUS.STATUS_HACK_UNSUCCESSFUL, 'lucide-shield-x'],
];

describe('ProblemStatus', () => {
  it.each(ICON_CASES)(
    'renders the icon for status %i',
    (statusCode, iconClass) => {
      const { container } = renderStatus(statusCode);
      expect(container.querySelector(`svg.${iconClass}`)).not.toBeNull();
    }
  );

  it('spins the icon for in-progress statuses only', () => {
    const judging = renderStatus(STATUS.STATUS_JUDGING);
    expect(judging.container.querySelector('svg')).toHaveClass('animate-spin');
    judging.unmount();

    const accepted = renderStatus(STATUS.STATUS_ACCEPTED);
    expect(accepted.container.querySelector('svg')).not.toHaveClass(
      'animate-spin'
    );
  });

  it('renders nothing when status is missing or unknown', () => {
    const { container } = renderStatus(undefined);
    expect(container.querySelector('svg')).toBeNull();

    const { container: unknownContainer } = renderStatus(999);
    expect(unknownContainer.querySelector('svg')).toBeNull();
  });
});

function renderStatusWithProgress(status?: number, progress?: number) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProblemStatus status={makeStatusDoc(status)} progress={progress} />
    </NextIntlClientProvider>
  );
}

const JUDGING_COLOR = 'rgb(75, 85, 99)';

function getBadge(container: HTMLElement) {
  return container.querySelector('[data-slot="badge"]') as HTMLElement;
}

function getProgressFill(container: HTMLElement) {
  return container.querySelector(
    '[data-slot="badge"] > span[aria-hidden="true"]'
  ) as HTMLElement | null;
}

describe('ProblemStatus progress', () => {
  it('fills the badge background up to the judging progress', () => {
    const { container } = renderStatusWithProgress(STATUS.STATUS_JUDGING, 40);

    expect(getBadge(container).style.borderColor).toBe(JUDGING_COLOR);
    const fill = getProgressFill(container);
    expect(fill).not.toBeNull();
    expect(fill!.style.backgroundColor).toBe(JUDGING_COLOR);
    expect(fill!.style.clipPath).toBe('inset(0 60% 0 0)');
  });

  it('shows only the outline at 0% and a full fill at 100%', () => {
    const { container: atZero } = renderStatusWithProgress(
      STATUS.STATUS_JUDGING,
      0
    );
    expect(getProgressFill(atZero)!.style.clipPath).toBe('inset(0 100% 0 0)');

    const { container: atFull } = renderStatusWithProgress(
      STATUS.STATUS_JUDGING,
      100
    );
    expect(getProgressFill(atFull)!.style.clipPath).toBe('inset(0 0% 0 0)');
  });

  it('keeps the solid badge when progress is missing', () => {
    const { container } = renderStatusWithProgress(STATUS.STATUS_JUDGING);

    expect(getProgressFill(container)).toBeNull();
    expect(getBadge(container).style.backgroundColor).toBe(JUDGING_COLOR);
  });

  it('ignores progress for finished statuses', () => {
    const { container } = renderStatusWithProgress(STATUS.STATUS_ACCEPTED, 60);

    expect(getProgressFill(container)).toBeNull();
    expect(getBadge(container).style.backgroundColor).toBe('rgb(22, 163, 74)');
  });
});
