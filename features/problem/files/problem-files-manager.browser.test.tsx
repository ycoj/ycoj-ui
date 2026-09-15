import ProblemFilesManager from './problem-files-manager';
import ClientApis from '@/api/client/method';
import messages from '@/messages/en';
import { act } from '@/tests/browser/act';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  queuedFiles: [] as { file: File }[],
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock('./create-file-dialog', () => ({ default: () => null }));
vi.mock('./rename-file-dialog', () => ({ default: () => null }));

// `useUploader` from `alova/client` does not drive its queue in browser mode,
// so keep its documented contract and let the manager logic stay under test.
vi.mock('alova/client', () => ({
  useUploader: (handler: (item: { file: File }) => Promise<unknown>) => ({
    appendFiles: (items: { file: File }[]) => {
      mocks.queuedFiles = items;
      return Promise.resolve();
    },
    removeFiles: () => {
      mocks.queuedFiles = [];
    },
    upload: async () => {
      const results = await Promise.allSettled(
        mocks.queuedFiles.map(async (item) => {
          const request = await handler(item);
          return await (request as Promise<unknown>);
        })
      );
      return results.map((result) =>
        result.status === 'fulfilled' ? result.value : (result.reason as Error)
      );
    },
    uploading: false,
  }),
}));

type ProgressHandler = (progress: { loaded: number; total: number }) => void;

type ControlledUpload = {
  file: File;
  promise: Promise<unknown>;
  emitProgress: (loaded: number, total: number) => void;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

let controlledUploads: ControlledUpload[] = [];

function createControlledRequest(file: File) {
  let handler: ProgressHandler | undefined;
  let resolve!: (value: unknown) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<unknown>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  const upload: ControlledUpload = {
    file,
    promise,
    emitProgress: (loaded, total) => handler?.({ loaded, total }),
    resolve,
    reject,
  };
  controlledUploads.push(upload);

  const request = {
    onUpload(nextHandler: ProgressHandler) {
      handler = nextHandler;
      return request;
    },
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
  };
  return request;
}

function mockUploads() {
  return vi
    .spyOn(ClientApis.Problem, 'uploadProblemFile')
    .mockImplementation(((_pid: string, file: File) =>
      createControlledRequest(file)) as never);
}

let uploadProblemFileSpy: ReturnType<typeof mockUploads>;

function renderManager() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProblemFilesManager
        pid="1000"
        tid="contest-id"
        testdata={[]}
        additionalFiles={[]}
        canManage
      />
    </NextIntlClientProvider>
  );
}

function getFileInputs(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLInputElement>('input[type="file"]')
  );
}

function selectFiles(input: HTMLInputElement, files: File[]) {
  // Hidden file inputs ignore `setInputFiles`; invoke the React change handler
  // with a real FileList so the browser keeps real file objects and layout.
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: transfer.files,
  });
  const propsKey = Object.keys(input).find((key) =>
    key.startsWith('__reactProps$')
  );
  const props = propsKey
    ? (
        input as unknown as Record<
          string,
          { onChange?: (event: unknown) => void }
        >
      )[propsKey]
    : undefined;
  if (props?.onChange) {
    props.onChange({ target: input, currentTarget: input });
    return;
  }
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

beforeEach(() => {
  controlledUploads = [];
  mocks.refresh.mockReset();
  // Re-create the spy after `restoreMocks` runs so the component hits it.
  uploadProblemFileSpy = mockUploads();
});

test('uploads selected files in parallel and reports weighted progress', async () => {
  const { container } = await renderManager();
  const [testdataInput] = getFileInputs(container);
  const smallFile = new File(['a'], 'small.in');
  const largeFile = new File(['bbb'], 'large.out');

  expect(testdataInput.hasAttribute('multiple')).toBe(true);
  selectFiles(testdataInput, [smallFile, largeFile]);

  await expect.poll(() => controlledUploads.length).toBe(2);
  expect(uploadProblemFileSpy).toHaveBeenNthCalledWith(
    1,
    '1000',
    smallFile,
    'testdata',
    undefined,
    'contest-id'
  );
  expect(uploadProblemFileSpy).toHaveBeenNthCalledWith(
    2,
    '1000',
    largeFile,
    'testdata',
    undefined,
    'contest-id'
  );

  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  await expect.element(dialog).toHaveTextContent('Uploading 2 files');

  await act(async () => {
    controlledUploads[0].emitProgress(1, 1);
    controlledUploads[1].emitProgress(1, 3);
  });

  await expect.element(page.getByText('50%', { exact: true })).toBeVisible();
  expect(
    page.getByRole('progressbar').element().getAttribute('aria-valuenow')
  ).toBe('50');

  await userEvent.keyboard('{Escape}');
  await expect.element(dialog).toBeVisible();

  await act(async () => {
    controlledUploads.forEach((upload) => upload.resolve({}));
    await Promise.all(controlledUploads.map((upload) => upload.promise));
  });

  await expect.element(dialog).not.toBeInTheDocument();
  expect(mocks.refresh).toHaveBeenCalledTimes(1);
});

test('keeps successful files and reports a partial failure', async () => {
  const { container } = await renderManager();
  const [, additionalInput] = getFileInputs(container);
  const files = [new File(['a'], 'readme.txt'), new File(['b'], 'data.txt')];

  selectFiles(additionalInput, files);
  await expect.poll(() => controlledUploads.length).toBe(2);

  await act(async () => {
    controlledUploads[0].resolve({});
    controlledUploads[1].reject(new Error('network failure'));
    await Promise.allSettled(controlledUploads.map((upload) => upload.promise));
  });

  const alertDialog = page.getByRole('alertdialog');
  await expect.element(alertDialog).toBeVisible();
  await expect
    .element(alertDialog)
    .toHaveTextContent(
      '1 of 2 files failed to upload. Successfully uploaded files were kept.'
    );
  expect(mocks.refresh).toHaveBeenCalledTimes(1);
  expect(uploadProblemFileSpy).toHaveBeenNthCalledWith(
    1,
    '1000',
    files[0],
    'additional_file',
    undefined,
    'contest-id'
  );
});

test('resets progress for a later upload batch', async () => {
  const { container } = await renderManager();
  const [testdataInput] = getFileInputs(container);

  selectFiles(testdataInput, [new File(['first'], 'first.in')]);
  await expect.poll(() => controlledUploads.length).toBe(1);
  await act(async () => controlledUploads[0].emitProgress(4, 5));
  await expect.element(page.getByText('80%', { exact: true })).toBeVisible();

  await act(async () => {
    controlledUploads[0].resolve({});
    await controlledUploads[0].promise;
  });
  await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

  selectFiles(testdataInput, [new File(['second'], 'second.in')]);
  await expect.poll(() => controlledUploads.length).toBe(2);

  await expect
    .element(page.getByRole('dialog'))
    .toHaveTextContent('Uploading 1 file');
  await expect.element(page.getByText('0%', { exact: true })).toBeVisible();
});

test('shows a link to the generation page when allowed', async () => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProblemFilesManager
        pid="1000"
        testdata={[]}
        additionalFiles={[]}
        canManage
        canGenerate
      />
    </NextIntlClientProvider>
  );

  const link = page.getByRole('link', { name: 'Open the generation page' });
  await expect.element(link).toBeVisible();
  expect(link.element().getAttribute('href')).toBe('/problem/1000/generate');
});

test('hides the generation entry when not allowed', async () => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProblemFilesManager
        pid="1000"
        testdata={[]}
        additionalFiles={[]}
        canManage
      />
    </NextIntlClientProvider>
  );

  await expect
    .element(page.getByRole('link', { name: 'Open the generation page' }))
    .not.toBeInTheDocument();
});
