import ReactPdfViewer from './react-pdf-viewer';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('ReactPdfViewer', () => {
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

  function setPageIntersection(
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

    act(() =>
      observer.callback(
        [{ isIntersecting, target: element } as IntersectionObserverEntry],
        {} as IntersectionObserver
      )
    );
  }

  it('only renders pages near the viewport and fits them to the container', () => {
    const { container } = render(<ReactPdfViewer src="/document.pdf" />);

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

    act(() => documentProps.onLoadSuccess({ numPages: 3 }));

    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByLabelText('PDF page 1')).toHaveAttribute(
      'data-width',
      '776'
    );

    setPageIntersection(container, 2, true);
    expect(screen.getAllByRole('img')).toHaveLength(2);

    setPageIntersection(container, 1, false);
    expect(screen.queryByLabelText('PDF page 1')).not.toBeInTheDocument();
    expect(screen.getByLabelText('PDF page 2')).toBeInTheDocument();

    act(() => pdfMocks.resize?.(500));

    expect(screen.getByLabelText('PDF page 2')).toHaveAttribute(
      'data-width',
      '476'
    );
    expect(pdfMocks.workerOptions.workerSrc).toContain(
      'pdfjs-dist/build/pdf.worker.min.mjs'
    );
  });

  it('limits oversized documents before creating page placeholders', () => {
    const { container } = render(<ReactPdfViewer src="/large-document.pdf" />);
    const documentProps = pdfMocks.documentProps as {
      onLoadSuccess: (pdf: { numPages: number }) => void;
    };

    act(() => documentProps.onLoadSuccess({ numPages: 501 }));

    expect(container.querySelectorAll('[data-pdf-page]')).toHaveLength(500);
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Only the first 500 of 501 pages are shown.'
    );
  });
});
