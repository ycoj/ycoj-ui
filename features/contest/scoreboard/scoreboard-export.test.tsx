import ScoreboardExport from './scoreboard-export';
import ClientApis from '@/api/client/method';
import messages from '@/messages/en.json';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client/method', () => ({
  default: { Contest: { downloadScoreboard: vi.fn() } },
}));
function setup(
  canExportPrivate = true,
  pageType: 'contest' | 'homework' = 'contest'
) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ScoreboardExport
        title="Contest"
        canExportPrivate={canExportPrivate}
        tid="tid"
        pageType={pageType}
      />
    </NextIntlClientProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Export image' }));
}
function submit() {
  fireEvent.click(screen.getAllByRole('button', { name: 'Export image' })[1]);
}
beforeEach(() => {
  vi.restoreAllMocks();
  vi.mocked(ClientApis.Contest.downloadScoreboard)
    .mockReset()
    .mockResolvedValue(new Blob(['png']));
  URL.createObjectURL = vi.fn(() => 'blob:export');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});
describe('server scoreboard downloads', () => {
  it('downloads the PNG returned by the server', async () => {
    setup();
    submit();
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
    expect(ClientApis.Contest.downloadScoreboard).toHaveBeenCalledWith(
      'contest',
      'tid',
      { avatar: false, realName: false, details: false }
    );
    const link = vi.mocked(HTMLAnchorElement.prototype.click).mock
      .instances[0] as HTMLAnchorElement;
    expect(link.download).toBe('Contest.png');
    expect(
      screen.queryByRole('dialog', { name: 'Exporting...' })
    ).not.toBeInTheDocument();
  });
  it('passes real-name, avatar and detail options and downloads a ZIP for homework', async () => {
    setup(true, 'homework');
    for (const name of [
      'Use real names',
      'Include avatars',
      'Include submission details',
    ])
      fireEvent.click(screen.getByRole('checkbox', { name }));
    submit();
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
    expect(ClientApis.Contest.downloadScoreboard).toHaveBeenCalledWith(
      'homework',
      'tid',
      { avatar: true, realName: true, details: true }
    );
    expect(
      (
        vi.mocked(HTMLAnchorElement.prototype.click).mock
          .instances[0] as HTMLAnchorElement
      ).download
    ).toBe('Contest.zip');
  });
  it('disables options for ordinary viewers', () => {
    setup(false);
    expect(
      screen.getByRole('checkbox', { name: 'Use real names' })
    ).toBeDisabled();
    expect(
      screen.getByRole('checkbox', { name: 'Include submission details' })
    ).toBeDisabled();
  });
  it('keeps controls busy while the server is generating the file and allows retry on failure', async () => {
    let rejectDownload: (error: Error) => void = () => {};
    vi.mocked(ClientApis.Contest.downloadScoreboard).mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectDownload = reject;
        }) as ReturnType<typeof ClientApis.Contest.downloadScoreboard>
    );
    setup();
    submit();
    const progress = screen.getByRole('dialog', { name: 'Exporting...' });
    expect(progress).toHaveTextContent('Please keep this page open');
    fireEvent.keyDown(progress, { key: 'Escape' });
    expect(screen.getByRole('dialog', { name: 'Exporting...' })).toBeVisible();
    rejectDownload(new Error('failed'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Export failed');
    expect(
      screen.queryByRole('dialog', { name: 'Exporting...' })
    ).not.toBeInTheDocument();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(
      screen.getAllByRole('button', { name: 'Export image' })[1]
    ).toBeEnabled();
  });
});
