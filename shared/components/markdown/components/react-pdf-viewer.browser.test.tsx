import ReactPdfViewer from './react-pdf-viewer';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement, ReactNode } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

const pdfMocks = vi.hoisted(() => ({
  documentProps: {} as Record<string, unknown>,
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
  Page: ({ pageNumber, width }: { pageNumber: number; width: number }) => (
    <canvas
      aria-label={`PDF page ${String(pageNumber)}`}
      data-width={String(width)}
      role="img"
    />
  ),
  pdfjs: {
    GlobalWorkerOptions: pdfMocks.workerOptions,
  },
}));

beforeEach(() => {
  pdfMocks.documentProps = {};
});

// `size-full` needs a sized ancestor, so the viewer runs inside a fixed box.
// The scroll container is the component root and both observers stay real:
// scrolling moves pages across the viewport boundary and resizing the box
// feeds the ResizeObserver.
async function renderViewer(
  width: number,
  height: number,
  { pages = 3, src = '/document.pdf' }: { pages?: number; src?: string } = {}
) {
  const view = await render(
    <div style={{ width, height }}>
      <ReactPdfViewer src={src} />
    </div>,
    { wrapper: IntlWrapper }
  );
  const scroller = view.container.querySelector('[role="document"]')!
    .parentElement as HTMLElement;
  if (pages > 0) {
    (
      pdfMocks.documentProps as {
        onLoadSuccess: (pdf: { numPages: number }) => void;
      }
    ).onLoadSuccess({ numPages: pages });
    await expect
      .poll(() => Boolean(view.container.querySelector('[data-pdf-page="1"]')))
      .toBe(true);
  }
  return { view, scroller };
}

async function canvasLabels() {
  return (await page.getByRole('img').elements())
    .map((element) => element.getAttribute('aria-label'))
    .sort();
}

test('only renders pages near the viewport and fits them to the container', async () => {
  const { view, scroller } = await renderViewer(800, 500);

  const documentProps = pdfMocks.documentProps as {
    file: string;
    options: Record<string, unknown>;
  };

  expect(documentProps.file).toBe('/document.pdf');
  expect(documentProps.options).toEqual({
    maxImageSize: 16_777_216,
    stopAtErrors: true,
    withCredentials: false,
  });

  await expect.poll(canvasLabels).toEqual(['PDF page 1']);

  const first = view.container.querySelector('[data-pdf-page="1"]')!;
  const reportedWidth = Number(
    first.querySelector('canvas')!.getAttribute('data-width')
  );
  expect(reportedWidth).toBeGreaterThan(0);
  expect(first.getBoundingClientRect().width).toBe(reportedWidth);
  expect(reportedWidth).toBeLessThanOrEqual(800);

  // Scrolling near page 2 mounts it while page 1 stays (100% root margin).
  scroller.scrollTop = 700;
  await expect.poll(canvasLabels).toEqual(['PDF page 1', 'PDF page 2']);

  // Scrolling far past page 1 unmounts it while pages 2 and 3 stay mounted.
  scroller.scrollTop = 1900;
  await expect.poll(canvasLabels).toEqual(['PDF page 2', 'PDF page 3']);

  // Deeper scrolling eventually drops page 2 as well.
  scroller.scrollTop = 2900;
  await expect.poll(canvasLabels).toEqual(['PDF page 3']);

  // Scrolling back remounts page 1 and unmounts page 2.
  scroller.scrollTop = 0;
  await expect.poll(canvasLabels).toEqual(['PDF page 1']);

  expect(pdfMocks.workerOptions.workerSrc).toContain(
    'pdfjs-dist/build/pdf.worker.min.mjs'
  );
});

test('shrinks the rendered page when the container narrows', async () => {
  const { view } = await renderViewer(800, 500, { pages: 2 });

  const widthOfPage = () =>
    Number(
      view.container
        .querySelector('[data-pdf-page="1"] canvas')
        ?.getAttribute('data-width') ?? 0
    );
  await expect.poll(widthOfPage).toBeGreaterThan(0);
  expect(widthOfPage()).toBeLessThanOrEqual(800);
  const beforeResize = widthOfPage();

  await view.rerender(
    <IntlWrapper>
      <div style={{ width: 480, height: 500 }}>
        <ReactPdfViewer src="/document.pdf" />
      </div>
    </IntlWrapper>
  );
  (
    pdfMocks.documentProps as {
      onLoadSuccess: (pdf: { numPages: number }) => void;
    }
  ).onLoadSuccess({ numPages: 2 });

  await expect.poll(widthOfPage).toBeGreaterThan(0);
  expect(widthOfPage()).toBeLessThan(beforeResize);
  expect(widthOfPage()).toBeLessThanOrEqual(480);
});

test('shows the fetch error message when loading the document fails', async () => {
  await renderViewer(800, 500, { pages: 0 });
  const documentProps = pdfMocks.documentProps as {
    onLoadError: (error: Error) => void;
  };

  documentProps.onLoadError(new Error('Failed to fetch'));
  const detailOf = () => {
    const errorNode = (
      pdfMocks.documentProps as {
        error?: ReactElement<{ detail: string | null }>;
      }
    ).error;
    return errorNode?.props?.detail ?? null;
  };
  await expect.poll(detailOf).toBe('Failed to fetch');

  const { error } = pdfMocks.documentProps as { error: ReactNode };
  const alertView = await render(error, { wrapper: IntlWrapper });

  const alert =
    alertView.container.querySelector<HTMLElement>('[role="alert"]')!;
  await expect.element(alert).toBeVisible();
  await expect
    .element(alert)
    .toHaveTextContent('The PDF could not be displayed.');
  await expect.element(alert).toHaveTextContent('Failed to fetch');
});

test('limits oversized documents before creating page placeholders', async () => {
  const { view } = await renderViewer(800, 500, {
    pages: 501,
    src: '/large-document.pdf',
  });

  await expect
    .poll(() => view.container.querySelectorAll('[data-pdf-page]').length)
    .toBe(500);
  await expect.poll(canvasLabels).toEqual(['PDF page 1']);

  const warning = page.getByRole('alert');
  await expect.element(warning).toBeVisible();
  await expect
    .element(warning)
    .toHaveTextContent('Only the first 500 of 501 pages are shown.');
});
