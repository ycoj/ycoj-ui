import ReactPdfViewer from './react-pdf-viewer';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { act, type ReactNode } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

const pdfMocks = vi.hoisted(() => ({
  documentProps: {} as Record<string, unknown>,
  intersectionObservers: [] as {
    callback: IntersectionObserverCallback;
    elements: Set<Element>;
  }[],
  pageProps: [] as Record<string, unknown>[],
  resize: undefined as ((width: number) => void) | undefined,
  workerOptions: { workerSrc: '' },
}));

function IntlWrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

vi.mock('react-pdf', () => ({
  Document: ({ children, ...props }: React.PropsWithChildren) => {
    pdfMocks.documentProps = props;
    return <div data-testid="react-pdf-document">{children}</div>;
  },
  Page: (props: Record<string, unknown>) => {
    pdfMocks.pageProps.push(props);
    return (
      <canvas
        aria-label={`PDF page ${String(props.pageNumber)}`}
        data-width={String(props.width)}
        role="img"
      />
    );
  },
  pdfjs: {
    GlobalWorkerOptions: pdfMocks.workerOptions,
  },
}));

beforeEach(() => {
  pdfMocks.documentProps = {};
  pdfMocks.intersectionObservers = [];
  pdfMocks.pageProps = [];
  pdfMocks.resize = undefined;

  vi.stubGlobal(
    'IntersectionObserver',
    class {
      private record: (typeof pdfMocks.intersectionObservers)[number];

      constructor(callback: IntersectionObserverCallback) {
        this.record = { callback, elements: new Set() };
        pdfMocks.intersectionObservers.push(this.record);
      }

      disconnect() {
        this.record.elements.clear();
      }

      observe(element: Element) {
        this.record.elements.add(element);
      }

      takeRecords() {
        return [];
      }

      unobserve(element: Element) {
        this.record.elements.delete(element);
      }
    }
  );

  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        pdfMocks.resize = (width) =>
          callback(
            [{ contentRect: { width } } as ResizeObserverEntry],
            this as unknown as ResizeObserver
          );
      }

      disconnect() {}

      observe() {
        pdfMocks.resize?.(800);
      }

      unobserve() {}
    }
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function setPageIntersection(
  container: HTMLElement,
  pageNumber: number,
  isIntersecting: boolean
) {
  const element = container.querySelector(`[data-pdf-page="${pageNumber}"]`);
  if (!element) throw new Error(`PDF page ${pageNumber} was not found`);

  const observer = pdfMocks.intersectionObservers.find(({ elements }) =>
    elements.has(element)
  );
  if (!observer) throw new Error(`PDF page ${pageNumber} was not observed`);

  await act(async () =>
    observer.callback(
      [{ isIntersecting, target: element } as IntersectionObserverEntry],
      {} as IntersectionObserver
    )
  );
}

test('only renders pages near the viewport and fits them to the container', async () => {
  const { container } = await render(<ReactPdfViewer src="/document.pdf" />, {
    wrapper: IntlWrapper,
  });

  const documentProps = pdfMocks.documentProps as {
    file: string;
    onLoadSuccess: (pdf: { numPages: number }) => void;
    options: Record<string, unknown>;
  };

  expect(documentProps.file).toBe('/document.pdf');
  expect(documentProps.options).toEqual({
    maxImageSize: 16_777_216,
    stopAtErrors: true,
    withCredentials: false,
  });

  await act(async () => documentProps.onLoadSuccess({ numPages: 3 }));

  await expect.poll(() => page.getByRole('img').elements().length).toBe(1);
  const first = page.getByLabelText('PDF page 1');
  await expect.element(first).toBeVisible();
  expect(first.element().getAttribute('data-width')).toBe('776');

  await setPageIntersection(container, 2, true);
  await expect.poll(() => page.getByRole('img').elements().length).toBe(2);

  await setPageIntersection(container, 1, false);
  await expect
    .element(page.getByLabelText('PDF page 1'))
    .not.toBeInTheDocument();
  await expect.element(page.getByLabelText('PDF page 2')).toBeVisible();

  await act(async () => pdfMocks.resize?.(500));

  await expect
    .poll(() =>
      page.getByLabelText('PDF page 2').element().getAttribute('data-width')
    )
    .toBe('476');
  expect(pdfMocks.workerOptions.workerSrc).toContain(
    'pdfjs-dist/build/pdf.worker.min.mjs'
  );
});

test('shows the fetch error message when loading the document fails', async () => {
  await render(<ReactPdfViewer src="/document.pdf" />, {
    wrapper: IntlWrapper,
  });
  const documentProps = pdfMocks.documentProps as {
    onLoadError: (error: Error) => void;
  };

  await act(async () =>
    documentProps.onLoadError(new Error('Failed to fetch'))
  );

  const { error } = pdfMocks.documentProps as { error: ReactNode };
  await render(error, { wrapper: IntlWrapper });

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect
    .element(alert)
    .toHaveTextContent('The PDF could not be displayed.');
  await expect.element(alert).toHaveTextContent('Failed to fetch');
});

test('limits oversized documents before creating page placeholders', async () => {
  const { container } = await render(
    <ReactPdfViewer src="/large-document.pdf" />,
    { wrapper: IntlWrapper }
  );
  const documentProps = pdfMocks.documentProps as {
    onLoadSuccess: (pdf: { numPages: number }) => void;
  };

  await act(async () => documentProps.onLoadSuccess({ numPages: 501 }));

  await expect
    .poll(() => container.querySelectorAll('[data-pdf-page]').length)
    .toBe(500);
  await expect.poll(() => page.getByRole('img').elements().length).toBe(1);

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect
    .element(alert)
    .toHaveTextContent('Only the first 500 of 501 pages are shown.');
});
