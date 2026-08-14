import ContestStatus, {
  getContestStatusBadgeClassName,
  getContestStatusHoverTextClassName,
  getContestStatusTextClassName,
} from './contest-status';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

describe('contest status helpers', () => {
  it('returns distinct text classes by status', () => {
    expect(getContestStatusTextClassName('running')).toContain('text-pink-600');
    expect(getContestStatusTextClassName('pending')).toContain('text-sky-700');
    expect(getContestStatusTextClassName('ended')).toContain('text-foreground');
  });

  it('keeps hover text colors aligned with status colors', () => {
    expect(getContestStatusHoverTextClassName('running')).toContain(
      'hover:text-pink-600'
    );
    expect(getContestStatusHoverTextClassName('pending')).toContain(
      'hover:text-sky-700'
    );
    expect(getContestStatusHoverTextClassName('ended')).toContain(
      'hover:text-primary'
    );
  });

  it('returns badge classes with running/pending overrides', () => {
    expect(getContestStatusBadgeClassName('running')).toContain('bg-pink-100');
    expect(getContestStatusBadgeClassName('pending')).toContain('bg-sky-100');
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
    const pendingLabel = screen.getByText('Upcoming');
    expect(pendingLabel).toBeInTheDocument();
    expect(pendingLabel.closest('[data-slot="badge"]')).toHaveClass(
      'bg-sky-100',
      'text-sky-700'
    );

    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ContestStatus status="ended" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Ended')).toBeInTheDocument();
  });
});
