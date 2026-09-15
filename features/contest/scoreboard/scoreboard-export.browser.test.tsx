import ScoreboardExport from './scoreboard-export';
import { DownloadResponseError } from '@/api/client/download';
import ClientApis from '@/api/client/method';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

vi.mock('@/api/client/method', () => ({
  default: { Contest: { downloadScoreboard: vi.fn() } },
}));

function renderExport(
  canExportPrivate = true,
  pageType: 'contest' | 'homework' = 'contest'
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ScoreboardExport
        title="Contest"
        canExportPrivate={canExportPrivate}
        tid="tid"
        pageType={pageType}
      />
    </NextIntlClientProvider>
  );
}

async function openPopover() {
  await userEvent.click(page.getByRole('button', { name: 'Export image' }));
  const content = document.querySelector('[data-slot="popover-content"]');
  expect(content).not.toBeNull();
}

async function submit() {
  const content = document.querySelector('[data-slot="popover-content"]')!;
  const button = Array.from(content.querySelectorAll('button')).find((entry) =>
    entry.textContent?.includes('Export image')
  );
  expect(button).toBeDefined();
  await userEvent.click(button!);
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

test('downloads the PNG returned by the server', async () => {
  await renderExport();
  await openPopover();
  await submit();

  await expect
    .poll(() => vi.mocked(URL.createObjectURL).mock.calls.length)
    .toBe(1);
  expect(ClientApis.Contest.downloadScoreboard).toHaveBeenCalledWith(
    'contest',
    'tid',
    { avatar: false, realName: false, details: false }
  );
  const link = vi.mocked(HTMLAnchorElement.prototype.click).mock
    .instances[0] as HTMLAnchorElement;
  expect(link.download).toBe('Contest.png');
  await expect
    .element(page.getByRole('dialog', { name: 'Exporting...' }))
    .not.toBeInTheDocument();
});

test('passes real-name, avatar and detail options and downloads a ZIP for homework', async () => {
  await renderExport(true, 'homework');
  await openPopover();

  for (const name of [
    'Use real names',
    'Include avatars',
    'Include submission details',
  ]) {
    await userEvent.click(page.getByRole('checkbox', { name }));
  }
  await submit();

  await expect
    .poll(() => vi.mocked(URL.createObjectURL).mock.calls.length)
    .toBe(1);
  expect(ClientApis.Contest.downloadScoreboard).toHaveBeenCalledWith(
    'homework',
    'tid',
    { avatar: true, realName: true, details: true }
  );
  const link = vi.mocked(HTMLAnchorElement.prototype.click).mock
    .instances[0] as HTMLAnchorElement;
  expect(link.download).toBe('Contest.zip');
});

test('disables options for ordinary viewers', async () => {
  await renderExport(false);
  await openPopover();

  await expect
    .element(page.getByRole('checkbox', { name: 'Use real names' }))
    .toBeDisabled();
  await expect
    .element(page.getByRole('checkbox', { name: 'Include submission details' }))
    .toBeDisabled();
});

test('shows the server-provided export error and clears it when the popover reopens', async () => {
  vi.mocked(ClientApis.Contest.downloadScoreboard).mockRejectedValue(
    new DownloadResponseError('This export is too large to generate.')
  );
  await renderExport();
  await openPopover();
  await submit();

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect
    .element(alert)
    .toHaveTextContent('This export is too large to generate.');
  const submitButtons = page.getByRole('button', { name: 'Export image' });
  await expect.poll(() => submitButtons.elements().length).toBe(2);
  await expect.element(submitButtons.nth(1)).toBeEnabled();

  await userEvent.click(submitButtons.nth(0));
  await expect.poll(() => page.getByRole('alert').elements().length).toBe(0);
  await userEvent.click(submitButtons.nth(0));
  await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
});

test('keeps controls busy while the server is generating the file and allows retry on failure', async () => {
  let rejectDownload: (error: Error) => void = () => {};
  vi.mocked(ClientApis.Contest.downloadScoreboard).mockImplementation(
    () =>
      new Promise((_resolve, reject) => {
        rejectDownload = reject;
      }) as ReturnType<typeof ClientApis.Contest.downloadScoreboard>
  );
  await renderExport();
  await openPopover();
  await submit();

  const progress = page.getByRole('dialog', { name: 'Exporting...' });
  await expect.element(progress).toBeVisible();
  await expect
    .element(progress)
    .toHaveTextContent('Please keep this page open');

  await userEvent.keyboard('{Escape}');
  await expect
    .element(page.getByRole('dialog', { name: 'Exporting...' }))
    .toBeVisible();

  rejectDownload(new Error('failed'));

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('Export failed');
  await expect
    .element(page.getByRole('dialog', { name: 'Exporting...' }))
    .not.toBeInTheDocument();
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  const submitButtons = page.getByRole('button', { name: 'Export image' });
  await expect.poll(() => submitButtons.elements().length).toBe(2);
  await expect.element(submitButtons.nth(1)).toBeEnabled();
});
