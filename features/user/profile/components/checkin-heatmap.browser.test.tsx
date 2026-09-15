import CheckinHeatmap from './checkin-heatmap';
import messages from '@/messages/en';
import type {
  CheckinFortune,
  CheckinHistory,
  CheckinRecord,
} from '@/shared/types/checkin';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const FORTUNE_LABELS: Record<CheckinFortune, string> = {
  da_ji: 'Great Fortune',
  ji: 'Fortune',
  ping: 'Neutral',
  xiong: 'Misfortune',
  da_xiong: 'Great Misfortune',
};

function makeRecord(
  date: string,
  fortune: CheckinFortune,
  text = `Quote for ${date}`
): CheckinRecord {
  return {
    date,
    fortune,
    hitokoto: {
      id: 1,
      uuid: `quote-${date}`,
      text,
      type: 'a',
      from: 'Source',
      fromWho: 'Author',
    },
  };
}

function renderHeatmap(history: CheckinHistory) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CheckinHeatmap history={history} />
    </NextIntlClientProvider>
  );
}

function legendSwatch(text: string) {
  const legend = document.querySelector<HTMLElement>(
    '[aria-label="Fortune legend"]'
  )!;
  const entry = Array.from(legend.children).find(
    (child) => child.textContent?.trim() === text
  );
  return entry!.firstElementChild as HTMLElement;
}

function cellBackground(name: string) {
  return getComputedStyle(page.getByRole('gridcell', { name }).element())
    .backgroundColor;
}

test('renders a full year of empty cells without an empty-state message', async () => {
  await renderHeatmap({
    timezone: 'UTC+08:00',
    from: '2025-08-02',
    to: '2026-08-01',
    total: 0,
    records: [],
  });

  await expect
    .poll(() => document.querySelectorAll('[role="gridcell"]').length)
    .toBe(365);
  await expect
    .element(page.getByText('No check-in records in the past year'))
    .not.toBeInTheDocument();

  const cell = page.getByRole('gridcell', {
    name: '2026-08-01: not checked in',
  });
  await expect.element(cell).toBeVisible();
  const bounds = cell.element().getBoundingClientRect();
  expect(bounds.width).toBe(24);
  expect(bounds.height).toBe(24);
  expect(getComputedStyle(cell.element()).backgroundColor).toBe(
    getComputedStyle(legendSwatch('No record')).backgroundColor
  );
});

test('paints every fortune with its matching legend color', async () => {
  const dates = [
    '2026-07-28',
    '2026-07-29',
    '2026-07-30',
    '2026-07-31',
    '2026-08-01',
  ];
  const fortunes: CheckinFortune[] = [
    'da_ji',
    'ji',
    'ping',
    'xiong',
    'da_xiong',
  ];
  await renderHeatmap({
    timezone: 'UTC+08:00',
    from: dates[0],
    to: dates[dates.length - 1],
    total: fortunes.length,
    records: fortunes.map((fortune, index) =>
      makeRecord(dates[index], fortune)
    ),
  });

  const backgrounds = new Set<string>();
  for (const [index, fortune] of fortunes.entries()) {
    const label = FORTUNE_LABELS[fortune];
    const background = cellBackground(
      `${dates[index]}: ${label}. Quote: Quote for ${dates[index]}`
    );
    expect(background).toBe(
      getComputedStyle(legendSwatch(label)).backgroundColor
    );
    backgrounds.add(background);
  }
  expect(backgrounds.size).toBe(fortunes.length);
});

test('shows the day details in a tooltip when a cell receives focus', async () => {
  await renderHeatmap({
    timezone: 'UTC+08:00',
    from: '2026-08-01',
    to: '2026-08-01',
    total: 1,
    records: [makeRecord('2026-08-01', 'ji', 'A lake formed behind the dam.')],
  });

  const cell = page.getByRole('gridcell', {
    name: '2026-08-01: Fortune. Quote: A lake formed behind the dam.',
  });
  await expect.element(cell).toBeVisible();
  cell.element().focus();

  const quote = page.getByText('A lake formed behind the dam.', {
    exact: true,
  });
  await expect.element(quote).toBeVisible();
  const tooltip = quote
    .element()
    .closest<HTMLElement>('[data-slot="tooltip-content"]')!;
  expect(getComputedStyle(tooltip).backgroundColor).not.toBe(
    'rgba(0, 0, 0, 0)'
  );
  await expect
    .poll(() => getComputedStyle(tooltip).color)
    .not.toBe('rgba(0, 0, 0, 0)');

  const cellBounds = () => cell.element().getBoundingClientRect();
  const tooltipBounds = () => tooltip.getBoundingClientRect();
  await expect
    .poll(() => {
      const trigger = cellBounds();
      const tip = tooltipBounds();
      return tip.top >= trigger.bottom
        ? tip.top - trigger.bottom
        : trigger.top - tip.bottom;
    })
    .toBeLessThan(40);
  const tip = tooltipBounds();
  expect(tip.left).toBeGreaterThanOrEqual(0);
  expect(tip.right).toBeLessThanOrEqual(window.innerWidth);
});

test('keeps one roving tab stop and follows arrow key navigation', async () => {
  await renderHeatmap({
    timezone: 'UTC+08:00',
    from: '2026-07-28',
    to: '2026-08-03',
    total: 0,
    records: [],
  });

  const cells = Array.from(
    document.querySelectorAll<HTMLElement>('[role="gridcell"]')
  );
  expect(cells).toHaveLength(7);
  expect(cells[0].tabIndex).toBe(0);
  expect(cells.filter((cell) => cell.tabIndex === -1)).toHaveLength(
    cells.length - 1
  );

  cells[0].focus();
  expect(document.activeElement).toBe(cells[0]);
  await userEvent.keyboard('{ArrowRight}');
  expect(document.activeElement).toBe(cells[5]);
  expect(cells[5].tabIndex).toBe(0);
  expect(cells[0].tabIndex).toBe(-1);
});

test('keeps the heatmap and legend colors consistent in the dark theme', async () => {
  await renderHeatmap({
    timezone: 'UTC+08:00',
    from: '2026-08-01',
    to: '2026-08-01',
    total: 1,
    records: [makeRecord('2026-08-01', 'da_ji')],
  });

  const cellName = '2026-08-01: Great Fortune. Quote: Quote for 2026-08-01';
  const lightBackground = cellBackground(cellName);
  expect(lightBackground).toBe(
    getComputedStyle(legendSwatch('Great Fortune')).backgroundColor
  );

  document.documentElement.classList.add('dark');
  await expect.poll(() => cellBackground(cellName)).not.toBe(lightBackground);
  expect(cellBackground(cellName)).toBe(
    getComputedStyle(legendSwatch('Great Fortune')).backgroundColor
  );
});
