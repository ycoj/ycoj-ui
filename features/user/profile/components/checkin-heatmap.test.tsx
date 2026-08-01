import CheckinHeatmap from './checkin-heatmap';
import messages from '@/messages/en.json';
import type { CheckinHistory } from '@/shared/types/checkin';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

function renderHeatmap(history: CheckinHistory) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CheckinHeatmap history={history} />
    </NextIntlClientProvider>
  );
}

describe('CheckinHeatmap', () => {
  it('renders 365 accessible date cells without an empty-state message', () => {
    renderHeatmap({
      timezone: 'UTC+08:00',
      from: '2025-08-02',
      to: '2026-08-01',
      total: 0,
      records: [],
    });

    expect(screen.getAllByRole('gridcell')).toHaveLength(365);
    expect(
      screen.getByRole('gridcell', { name: '2026-08-01: not checked in' })
    ).toBeInTheDocument();
    expect(
      screen.queryByText('No check-in records in the past year')
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Fortune legend')).toBeInTheDocument();
  });

  it('maps every fortune to its localized accessible description', () => {
    const fortunes = ['da_ji', 'ji', 'ping', 'xiong', 'da_xiong'] as const;
    const dates = [
      '2026-07-28',
      '2026-07-29',
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
    ];
    renderHeatmap({
      timezone: 'UTC+08:00',
      from: '2026-07-28',
      to: '2026-08-01',
      total: 5,
      records: fortunes.map((fortune, index) => ({
        date: dates[index],
        fortune,
        hitokoto: {
          id: index,
          uuid: `quote-${index}`,
          text: `Quote ${index}`,
          type: 'a',
          from: 'Source',
          fromWho: 'Author',
        },
      })),
    });

    expect(
      screen.getByRole('gridcell', {
        name: '2026-07-28: Great Fortune. Quote: Quote 0',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('gridcell', {
        name: '2026-08-01: Great Misfortune. Quote: Quote 4',
      })
    ).toBeInTheDocument();
  });

  it('uses roving tabindex and moves focus with arrow keys', () => {
    renderHeatmap({
      timezone: 'UTC+08:00',
      from: '2026-07-28',
      to: '2026-08-03',
      total: 0,
      records: [],
    });

    const cells = screen.getAllByRole('gridcell');
    expect(cells[0]).toHaveAttribute('tabindex', '0');
    expect(
      cells.filter((cell) => cell.getAttribute('tabindex') === '-1')
    ).toHaveLength(cells.length - 1);

    cells[0].focus();
    fireEvent.keyDown(cells[0], { key: 'ArrowRight' });

    expect(cells[5]).toHaveFocus();
    expect(cells[5]).toHaveAttribute('tabindex', '0');
  });
});
