import PasteDetailActions from './paste-detail-actions';
import messages from '@/messages/en.json';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

function renderActions(canManage: boolean) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PasteDetailActions id="abc123" canManage={canManage} />
    </NextIntlClientProvider>
  );
}

describe('paste detail actions', () => {
  it.each([true, false])('honors backend canManage=%s', (canManage) => {
    renderActions(canManage);
    expect(!!screen.queryByRole('link', { name: 'Edit snippet' })).toBe(
      canManage
    );
    const raw = screen.getByRole('link', { name: 'Raw text' });
    expect(raw).toHaveAttribute('href', '/paste/abc123/raw');
    expect(raw).toHaveAttribute('target', '_blank');
    expect(raw).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('copies an absolute detail URL on the current origin', async () => {
    const user = userEvent.setup();
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    renderActions(false);
    await user.click(screen.getByRole('button', { name: 'Copy link' }));
    await waitFor(() =>
      expect(write).toHaveBeenCalledWith(
        `${window.location.origin}/paste/abc123`
      )
    );
    expect(
      screen.getByRole('button', { name: 'Link copied' })
    ).toBeInTheDocument();
    write.mockRestore();
  });
});
