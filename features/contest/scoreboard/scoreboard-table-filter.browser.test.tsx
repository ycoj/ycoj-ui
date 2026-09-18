import ScoreboardTableFilter from './scoreboard-table-filter';
import messages from '@/messages/en';
import type { GDoc, ScoreboardRow } from '@/shared/types/contest';
import type { BaseUserDict } from '@/shared/types/user';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

const rows: ScoreboardRow[] = [
  [
    { type: 'rank', value: '#' },
    { type: 'user', value: 'User' },
    { type: 'total_score', value: 'Total' },
  ],
  [
    { type: 'rank', value: 1 },
    { type: 'user', value: 'alice', raw: 1 },
    { type: 'total_score', value: 300 },
  ],
  [
    { type: 'rank', value: 2 },
    { type: 'user', value: 'bob', raw: 2 },
    { type: 'total_score', value: 200 },
  ],
  [
    { type: 'rank', value: 0 },
    { type: 'user', value: 'carol', raw: 3 },
    { type: 'total_score', value: 100 },
  ],
];

const groups: GDoc[] = [
  { _id: 'g1', name: 'Alpha', uids: [1, 3] },
  { _id: 'g2', name: 'Empty', uids: [] },
];

const udict: BaseUserDict = {
  1: { _id: 1, uname: 'alice', mail: 'alice@example.com', avatar: '' },
  2: { _id: 2, uname: 'bob', mail: 'bob@example.com', avatar: '' },
  3: { _id: 3, uname: 'carol', mail: 'carol@example.com', avatar: '' },
};

function renderTable(filter?: string) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ScoreboardTableFilter
        rows={rows}
        udict={udict}
        pdict={{}}
        tid="tid"
        pageType="contest"
        groups={groups}
        filter={filter}
      />
    </NextIntlClientProvider>
  );
}

describe('scoreboard participant filtering', () => {
  it('shows every participant by default', () => {
    renderTable();

    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('carol')).toBeInTheDocument();
  });

  it('narrows to the selected group, hiding other participants', async () => {
    const user = userEvent.setup();
    renderTable();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Filter participants' }),
      'g1'
    );

    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('carol')).toBeInTheDocument();
    expect(screen.queryByText('bob')).not.toBeInTheDocument();
    expect(window.location.search).toContain('filter=g1');
  });

  it('hides unranked participants in the ranked filter', async () => {
    const user = userEvent.setup();
    renderTable();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Filter participants' }),
      'ranked'
    );

    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.queryByText('carol')).not.toBeInTheDocument();
  });

  it('restores every participant when switching back to all users', async () => {
    const user = userEvent.setup();
    renderTable('g1');

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Filter participants' }),
      'all'
    );

    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(window.location.search).not.toContain('filter=');
  });

  it('renders the selected filter on first paint', () => {
    renderTable('g1');

    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.queryByText('bob')).not.toBeInTheDocument();
  });

  it('explains an empty result instead of rendering an empty table', async () => {
    const user = userEvent.setup();
    renderTable();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Filter participants' }),
      'g2'
    );

    expect(
      screen.getByText('No participants match this filter.')
    ).toBeInTheDocument();
    expect(screen.queryByText('alice')).not.toBeInTheDocument();
  });
});
