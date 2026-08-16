import UserAutoComplete from './user-auto-complete';
import messages from '@/messages/en.json';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  searchUsers: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: { User: { searchUsers: mocks.searchUsers } },
}));

function Harness({
  onValueChange,
}: {
  onValueChange: (value: string) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <UserAutoComplete
      domainId="system"
      value={value}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        onValueChange(nextValue);
      }}
      placeholder="Submitter"
    />
  );
}

describe('UserAutoComplete', () => {
  afterEach(() => {
    vi.useRealTimers();
    mocks.searchUsers.mockReset();
  });

  it('submits the UID for a numeric username', async () => {
    vi.useFakeTimers();
    const onValueChange = vi.fn();
    mocks.searchUsers.mockReturnValue({
      send: vi.fn().mockResolvedValue([
        {
          _id: 7,
          uname: '123',
          displayName: 'Numeric user',
          avatarUrl: '',
        },
      ]),
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Harness onValueChange={onValueChange} />
      </NextIntlClientProvider>
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Submitter' }), {
      target: { value: '123' },
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText('UID = 7')).toBeInTheDocument();
    fireEvent.click(screen.getByText('123 (Numeric user)'));

    expect(mocks.searchUsers).toHaveBeenCalledWith('system', '123');
    expect(onValueChange).toHaveBeenLastCalledWith('7');
  });
});
