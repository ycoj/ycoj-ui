import ProblemFilesManager from './problem-files-manager';
import { uploadClientRequest } from '@/api/client';
import ClientApis from '@/api/client/method';
import messages from '@/messages/en.json';
import { createAlovaMockAdapter, defineMock } from '@alova/mock';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock('./create-file-dialog', () => ({ default: () => null }));
vi.mock('./rename-file-dialog', () => ({ default: () => null }));

type ProgressHandler = (progress: { loaded: number; total: number }) => void;

type ControlledUpload = {
  file: File;
  promise: Promise<unknown>;
  emitProgress: (loaded: number, total: number) => void;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

let controlledUploads: ControlledUpload[] = [];
const uploadByName = new Map<string, ControlledUpload>();

function createControlledUpload(file: File): ControlledUpload {
  const handlers: ProgressHandler[] = [];
  let resolve!: (value: unknown) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<unknown>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return {
    file,
    promise,
    resolve,
    reject,
    emitProgress: (loaded, total) =>
      handlers.forEach((handler) => handler({ loaded, total })),
  };
}

const mockGroup = defineMock({
  '[POST]/p/{pid}/files': ({ data }) => {
    const file = data instanceof FormData ? data.get('file') : null;
    const upload = file instanceof File ? uploadByName.get(file.name) : null;
    return upload?.promise ?? {};
  },
});

const mockAdapter = createAlovaMockAdapter([mockGroup], {
  delay: 0,
  mockRequestLogger: false,
  matchMode: 'methodurl',
  onMockResponse: (body) => ({ response: { data: body }, headers: {} }),
});

const testUploadAdapter: typeof mockAdapter = (elements, method) => {
  const file =
    elements.data instanceof FormData ? elements.data.get('file') : null;
  if (!(file instanceof File)) return mockAdapter(elements, method);
  const upload = createControlledUpload(file);
  controlledUploads.push(upload);
  uploadByName.set(file.name, upload);
  const request = mockAdapter(elements, method);
  return {
    ...request,
    onUpload: (handler: (loaded: number, total: number) => void) => {
      upload.emitProgress = (loaded, total) => handler(loaded, total);
    },
  };
};

const uploadClientOptions = uploadClientRequest as unknown as {
  options: { requestAdapter: typeof mockAdapter };
};
const originalUploadAdapter = uploadClientOptions.options.requestAdapter;
const uploadProblemFileSpy = vi.spyOn(ClientApis.Problem, 'uploadProblemFile');

uploadClientOptions.options.requestAdapter = testUploadAdapter;

afterAll(() => {
  uploadClientOptions.options.requestAdapter = originalUploadAdapter;
});

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
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: files,
  });
  fireEvent.change(input, { target: { files } });
}

describe('ProblemFilesManager uploads', () => {
  beforeEach(() => {
    controlledUploads = [];
    uploadByName.clear();
    mocks.refresh.mockReset();
    uploadProblemFileSpy.mockClear();
  });

  it('uploads selected files in parallel and reports weighted progress', async () => {
    const { container } = renderManager();
    const [testdataInput] = getFileInputs(container);
    const smallFile = new File(['a'], 'small.in');
    const largeFile = new File(['bbb'], 'large.out');

    expect(testdataInput).toHaveAttribute('multiple');
    selectFiles(testdataInput, [smallFile, largeFile]);

    await waitFor(() => expect(controlledUploads).toHaveLength(2));
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
    expect(screen.getByRole('dialog')).toHaveTextContent('Uploading 2 files');

    await act(async () => {
      controlledUploads[0].emitProgress(1, 1);
      controlledUploads[1].emitProgress(1, 3);
    });

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '50'
    );

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await act(async () => {
      controlledUploads.forEach((upload) => upload.resolve({}));
      await Promise.all(controlledUploads.map((upload) => upload.promise));
    });

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it('keeps successful files and reports a partial failure', async () => {
    const { container } = renderManager();
    const [, additionalInput] = getFileInputs(container);
    const files = [new File(['a'], 'readme.txt'), new File(['b'], 'data.txt')];

    selectFiles(additionalInput, files);
    await waitFor(() => expect(controlledUploads).toHaveLength(2));

    await act(async () => {
      controlledUploads[0].resolve({});
      controlledUploads[1].reject(new Error('network failure'));
      await Promise.allSettled(
        controlledUploads.map((upload) => upload.promise)
      );
    });

    expect(screen.getByRole('alertdialog')).toHaveTextContent(
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

  it('resets progress for a later upload batch', async () => {
    const { container } = renderManager();
    const [testdataInput] = getFileInputs(container);

    selectFiles(testdataInput, [new File(['first'], 'first.in')]);
    await waitFor(() => expect(controlledUploads).toHaveLength(1));
    await act(async () => controlledUploads[0].emitProgress(4, 5));
    expect(screen.getByText('80%')).toBeInTheDocument();

    await act(async () => {
      controlledUploads[0].resolve({});
      await controlledUploads[0].promise;
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    selectFiles(testdataInput, [new File(['second'], 'second.in')]);
    await waitFor(() => expect(controlledUploads).toHaveLength(2));

    expect(screen.getByRole('dialog')).toHaveTextContent('Uploading 1 file');
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
