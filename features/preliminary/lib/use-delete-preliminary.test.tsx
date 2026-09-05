import { useDeletePreliminary } from './use-delete-preliminary';
import messages from '@/messages/en.json';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  remove: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  confirm: vi.fn(),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    Preliminary: {
      deletePreliminary: (paperId: string) => ({
        send: () => mocks.remove(paperId),
      }),
    },
  },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

function Harness() {
  const { deleting, deleteError, handleDelete } =
    useDeletePreliminary('paper1');
  return (
    <>
      <button onClick={() => void handleDelete()} disabled={deleting}>
        {deleting ? 'deleting' : 'delete'}
      </button>
      {deleteError && <div role="alert">{deleteError}</div>}
    </>
  );
}

function renderHarness() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Harness />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  window.confirm = mocks.confirm;
  mocks.confirm.mockReturnValue(true);
  mocks.remove.mockResolvedValue({});
});

describe('useDeletePreliminary', () => {
  it('skips the request when the confirmation is dismissed', async () => {
    mocks.confirm.mockReturnValue(false);
    renderHarness();
    await userEvent.click(screen.getByRole('button', { name: 'delete' }));
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('navigates to the list after a successful delete', async () => {
    renderHarness();
    await userEvent.click(screen.getByRole('button', { name: 'delete' }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith('paper1'));
    expect(mocks.push).toHaveBeenCalledWith('/preliminary');
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('navigates to the backend url when present', async () => {
    mocks.remove.mockResolvedValue({ url: '/preliminary?from=delete' });
    renderHarness();
    await userEvent.click(screen.getByRole('button', { name: 'delete' }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith('paper1'));
    expect(mocks.push).toHaveBeenCalledWith('/preliminary?from=delete');
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('strips the domain prefix from the backend url', async () => {
    mocks.remove.mockResolvedValue({
      url: '/d/system/preliminary?from=delete',
    });
    renderHarness();
    await userEvent.click(screen.getByRole('button', { name: 'delete' }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith('paper1'));
    expect(mocks.push).toHaveBeenCalledWith('/preliminary?from=delete');
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('surfaces a failure without navigating on an error payload', async () => {
    mocks.remove.mockResolvedValue({ error: { message: 'denied' } });
    renderHarness();
    await userEvent.click(screen.getByRole('button', { name: 'delete' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.preliminary.deleteFailed
    );
    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'delete' })).toBeEnabled();
  });

  it('surfaces a failure without navigating when the request throws', async () => {
    mocks.remove.mockRejectedValue(new Error('network down'));
    renderHarness();
    await userEvent.click(screen.getByRole('button', { name: 'delete' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.preliminary.deleteFailed
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
