import ContestStatus, {
  getContestStatusBadgeClassName,
  getContestStatusTextClassName,
} from './contest-status';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

describe('contest status helpers', () => {
  it('returns distinct text classes by status', () => {
    expect(getContestStatusTextClassName('running')).toContain('text-pink-600');
    expect(getContestStatusTextClassName('pending')).toContain('text-blue-500');
    expect(getContestStatusTextClassName('ended')).toContain('text-foreground');
  });

  it('returns badge classes with running/pending overrides', () => {
    expect(getContestStatusBadgeClassName('running')).toContain('bg-pink-100');
    expect(getContestStatusBadgeClassName('pending')).toContain('bg-blue-100');
    expect(getContestStatusBadgeClassName('ended')).toContain('bg-muted');
  });
});

describe('ContestStatus', () => {
  it('renders the label for the given status', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ContestStatus status="running" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders pending and ended labels', () => {
    const { rerender } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ContestStatus status="pending" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Upcoming')).toBeInTheDocument();

    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ContestStatus status="ended" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Ended')).toBeInTheDocument();
  });
});
