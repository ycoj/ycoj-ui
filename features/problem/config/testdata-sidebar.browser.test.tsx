import { ProblemConfigProvider } from './problem-config-context';
import TestdataSidebar from './testdata-sidebar';
import ClientApis from '@/api/client/method';
import en from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from 'sonner';
import { afterEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const oldTestdata = [
  {
    _id: 'old',
    name: 'old.in',
    size: 1,
    etag: 'old',
    lastModified: new Date(0),
  },
];

function renderSidebar() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ProblemConfigProvider raw="type: default\n" testdata={oldTestdata}>
        <TestdataSidebar pid="1000" docId={1} title="Problem" />
        <Toaster richColors position="top-right" />
      </ProblemConfigProvider>
    </NextIntlClientProvider>
  );
}

function uploadRequest(succeeds: boolean) {
  return {
    onUpload: vi.fn(),
    send: succeeds
      ? vi.fn().mockResolvedValue({})
      : vi.fn().mockRejectedValue(new Error('upload failed')),
  } as unknown as ReturnType<typeof ClientApis.Problem.uploadProblemFile>;
}

async function selectFiles(count: number) {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input).not.toBeNull();
  const files = Array.from(
    { length: count },
    (_, index) => new File(['data'], `${index + 1}.in`)
  );
  await userEvent.upload(input!, files);
}

afterEach(() => {
  vi.restoreAllMocks();
});

test('reports a successful upload before refreshing', async () => {
  vi.spyOn(ClientApis.Problem, 'uploadProblemFile').mockReturnValueOnce(
    uploadRequest(true)
  );
  const refresh = vi
    .spyOn(ClientApis.Problem, 'refreshProblemTestdata')
    .mockResolvedValue([]);
  await renderSidebar();

  await selectFiles(1);

  await expect
    .element(page.getByText('Uploaded 1 file.', { exact: true }))
    .toBeVisible();
  await expect.poll(() => refresh.mock.calls.length).toBe(1);
});

test('reports a failed upload before refreshing', async () => {
  vi.spyOn(ClientApis.Problem, 'uploadProblemFile').mockReturnValueOnce(
    uploadRequest(false)
  );
  const refresh = vi
    .spyOn(ClientApis.Problem, 'refreshProblemTestdata')
    .mockResolvedValue([]);
  await renderSidebar();

  await selectFiles(1);

  await expect
    .element(page.getByText('Failed to upload 1 file.', { exact: true }))
    .toBeVisible();
  await expect.poll(() => refresh.mock.calls.length).toBe(1);
});

test('reports mixed upload outcomes before refreshing', async () => {
  vi.spyOn(ClientApis.Problem, 'uploadProblemFile')
    .mockReturnValueOnce(uploadRequest(true))
    .mockReturnValueOnce(uploadRequest(false));
  const refresh = vi
    .spyOn(ClientApis.Problem, 'refreshProblemTestdata')
    .mockResolvedValue([]);
  await renderSidebar();

  await selectFiles(2);

  await expect
    .element(page.getByText('1 of 2 files failed to upload.', { exact: true }))
    .toBeVisible();
  await expect.poll(() => refresh.mock.calls.length).toBe(1);
});

test('keeps the upload result and clears stale testdata when refresh fails', async () => {
  vi.spyOn(ClientApis.Problem, 'uploadProblemFile')
    .mockReturnValueOnce(uploadRequest(true))
    .mockReturnValueOnce(uploadRequest(false));
  vi.spyOn(ClientApis.Problem, 'refreshProblemTestdata').mockRejectedValue(
    new Error('refresh failed')
  );
  await renderSidebar();

  await selectFiles(2);

  await expect
    .element(page.getByText('1 of 2 files failed to upload.', { exact: true }))
    .toBeVisible();
  await expect
    .element(
      page.getByText(
        'The configuration was saved, but the test data list could not be refreshed.',
        { exact: true }
      )
    )
    .toBeVisible();
  await expect
    .element(page.getByText('old.in', { exact: true }))
    .not.toBeInTheDocument();
});
