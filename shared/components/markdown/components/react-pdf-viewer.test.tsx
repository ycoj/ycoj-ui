import ReactPdfViewer from './react-pdf-viewer';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pdfMocks = vi.hoisted(() => ({
  documentProps: {} as Record<string, unknown>,
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
    pdfMocks.pageProps = [];
    pdfMocks.resize = undefined;

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

  it('uses React-PDF and fits every page to the container width', () => {
    render(<ReactPdfViewer src="/document.pdf" />);

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

    expect(screen.getAllByRole('img')).toHaveLength(3);
    expect(screen.getByLabelText('PDF page 1')).toHaveAttribute(
      'data-width',
      '776'
    );

    act(() => pdfMocks.resize?.(500));

    expect(screen.getByLabelText('PDF page 1')).toHaveAttribute(
      'data-width',
      '476'
    );
    expect(pdfMocks.workerOptions.workerSrc).toContain(
      'pdfjs-dist/build/pdf.worker.min.mjs'
    );
  });
});
