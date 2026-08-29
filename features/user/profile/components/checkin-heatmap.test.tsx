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
    const emptyCell = screen.getByRole('gridcell', {
      name: '2026-08-01: not checked in',
    });
    expect(emptyCell).toBeInTheDocument();
    expect(emptyCell).toHaveClass('bg-muted');
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

  it('shows day details in a theme-aware tooltip', async () => {
    renderHeatmap({
      timezone: 'UTC+08:00',
      from: '2026-08-01',
      to: '2026-08-01',
      total: 1,
      records: [
        {
          date: '2026-08-01',
          fortune: 'ji',
          hitokoto: {
            id: 1,
            uuid: 'quote-1',
            text: 'A lake formed behind the dam.',
            type: 'a',
            from: 'A Poem',
            fromWho: 'Author',
          },
        },
      ],
    });

    screen
      .getByRole('gridcell', {
        name: '2026-08-01: Fortune. Quote: A lake formed behind the dam.',
      })
      .focus();

    const quote = await screen.findByText('A lake formed behind the dam.');
    expect(quote.closest('[data-slot="tooltip-content"]')).toHaveClass(
      'bg-popover',
      'text-popover-foreground'
    );
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
