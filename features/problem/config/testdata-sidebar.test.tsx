import { ProblemConfigProvider } from './problem-config-context';
import TestdataSidebar from './testdata-sidebar';
import ClientApis from '@/api/client/method';
import en from '@/messages/en.json';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ProblemConfigProvider raw="type: default\n" testdata={oldTestdata}>
        <TestdataSidebar pid="1000" docId={1} title="Problem" />
      </ProblemConfigProvider>
    </NextIntlClientProvider>
  );
}

function uploadRequest(succeeds: boolean) {
  const request = {
    onUpload: vi.fn(),
    send: succeeds
      ? vi.fn().mockResolvedValue({})
      : vi.fn().mockRejectedValue(new Error('upload failed')),
  };
  return request as unknown as ReturnType<
    typeof ClientApis.Problem.uploadProblemFile
  >;
}

function selectFiles(count: number) {
  const input = screen.getByLabelText('Upload files', { selector: 'input' });
  const files = Array.from(
    { length: count },
    (_, index) => new File(['data'], `${index + 1}.in`)
  );
  fireEvent.change(input, { target: { files } });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TestdataSidebar uploads', () => {
  it.each([
    {
      outcomes: [true],
      toastMethod: 'success' as const,
      message: 'Uploaded 1 file.',
    },
    {
      outcomes: [false],
      toastMethod: 'error' as const,
      message: 'Failed to upload 1 file.',
    },
    {
      outcomes: [true, false],
      toastMethod: 'error' as const,
      message: '1 of 2 files failed to upload.',
    },
  ])(
    'reports each upload outcome before refreshing',
    async ({ outcomes, toastMethod, message }) => {
      const successToast = vi
        .spyOn(toast, 'success')
        .mockImplementation(() => '');
      const errorToast = vi.spyOn(toast, 'error').mockImplementation(() => '');
      const upload = vi.spyOn(ClientApis.Problem, 'uploadProblemFile');
      outcomes.forEach((succeeds) =>
        upload.mockReturnValueOnce(uploadRequest(succeeds))
      );
      const refresh = vi
        .spyOn(ClientApis.Problem, 'refreshProblemTestdata')
        .mockResolvedValue([]);
      renderSidebar();

      selectFiles(outcomes.length);

      await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
      const outcomeToast =
        toastMethod === 'success' ? successToast : errorToast;
      expect(outcomeToast).toHaveBeenCalledWith(message);
      expect(outcomeToast.mock.invocationCallOrder[0]).toBeLessThan(
        refresh.mock.invocationCallOrder[0]
      );
    }
  );

  it('keeps the upload result and clears stale testdata when refresh fails', async () => {
    const errorToast = vi.spyOn(toast, 'error').mockImplementation(() => '');
    vi.spyOn(toast, 'success').mockImplementation(() => '');
    vi.spyOn(ClientApis.Problem, 'uploadProblemFile')
      .mockReturnValueOnce(uploadRequest(true))
      .mockReturnValueOnce(uploadRequest(false));
    vi.spyOn(ClientApis.Problem, 'refreshProblemTestdata').mockRejectedValue(
      new Error('refresh failed')
    );
    renderSidebar();

    selectFiles(2);

    await waitFor(() =>
      expect(screen.queryByText('old.in')).not.toBeInTheDocument()
    );
    expect(errorToast).toHaveBeenNthCalledWith(
      1,
      '1 of 2 files failed to upload.'
    );
    expect(errorToast).toHaveBeenNthCalledWith(
      2,
      'The configuration was saved, but the test data list could not be refreshed.'
    );
  });
});
