import { pasteDoc, pasteOptions } from './paste.test-utils';
import EditPage, {
  generateMetadata as editMetadata,
} from '@/app/(app)/paste/[id]/edit/page';
import DetailPage, {
  generateMetadata as detailMetadata,
} from '@/app/(app)/paste/[id]/page';
import MainPage from '@/app/(app)/paste/page';
import messages from '@/messages/en';
import type { HydroError } from '@/shared/types/error';
import { createTranslator } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  detail: vi.fn(),
  edit: vi.fn(),
  main: vi.fn(),
}));
vi.mock('@/features/paste/get-paste', () => ({
  getPasteDetail: mocks.detail,
  getPasteEdit: mocks.edit,
}));
vi.mock('@/api/server/method', () => ({
  default: { Paste: { getPasteMain: mocks.main } },
}));
vi.mock('next-intl/server', () => ({
  getTranslations: async () =>
    createTranslator({ locale: 'en', messages, namespace: 'paste' }),
}));
vi.mock('@/features/paste/create/paste-create-form', () => ({
  default: () => <div>Paste form</div>,
}));
vi.mock('@/features/paste/edit/paste-edit-form', () => ({
  default: () => <div>Paste form</div>,
}));
vi.mock('@/features/paste/paste-history', () => ({
  default: () => <div>Paste history</div>,
}));
vi.mock('@/features/paste/paste-detail', () => ({
  default: () => <div>Paste detail</div>,
}));
vi.mock('@/shared/components/errored', () => ({
  Errored: ({ error }: { error: HydroError }) => (
    <div role="alert">{error.message}</div>
  ),
}));

beforeEach(() => vi.clearAllMocks());

test.each(['NotFoundError', 'ForbiddenError', 'PrivilegeError'])(
  'renders %s safely in detail and metadata',
  async (name) => {
    mocks.detail.mockResolvedValue({
      error: { name, message: 'Unavailable' },
    });
    const props = { params: Promise.resolve({ id: 'abc123' }) };
    expect(await detailMetadata(props)).toEqual({ title: 'Share Snippets' });
    await render(await DetailPage(props));

    const alert = page.getByRole('alert');
    await expect.element(alert).toBeVisible();
    await expect.element(alert).toHaveTextContent('Unavailable');
  }
);

test('does not render an edit form when backend access is denied', async () => {
  mocks.edit.mockResolvedValue({
    error: { name: 'ForbiddenError', message: 'Permission denied' },
  });
  const props = { params: Promise.resolve({ id: 'abc123' }) };
  expect(await editMetadata(props)).toEqual({ title: 'Edit snippet' });
  await render(await EditPage(props));

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('Permission denied');
  await expect
    .element(page.getByText('Paste form', { exact: true }))
    .not.toBeInTheDocument();
});

test('uses the document title and allows an authorized edit', async () => {
  mocks.edit.mockResolvedValue({ ...pasteOptions, pdoc: pasteDoc });
  const props = { params: Promise.resolve({ id: 'abc123' }) };
  expect(await editMetadata(props)).toEqual({
    title: 'Example - Edit snippet',
  });
  await render(await EditPage(props));

  await expect
    .element(page.getByText('Paste form', { exact: true }))
    .toBeVisible();
});

test.each([undefined, '-1', '0', '2.5', 'invalid', ['2', '3']])(
  'normalizes invalid page %j',
  async (pageParam) => {
    mocks.main.mockResolvedValue({
      ...pasteOptions,
      pdocs: [],
      page: 1,
      ppcount: 0,
      pcount: 0,
    });
    await MainPage({ searchParams: Promise.resolve({ page: pageParam }) });
    expect(mocks.main).toHaveBeenCalledWith(1);
  }
);

test('keeps the create form and history together on later pages', async () => {
  mocks.main.mockResolvedValue({
    ...pasteOptions,
    pdocs: [pasteDoc],
    page: 2,
    ppcount: 3,
    pcount: 45,
  });
  await render(
    await MainPage({ searchParams: Promise.resolve({ page: '2' }) })
  );

  expect(mocks.main).toHaveBeenCalledWith(2);
  await expect
    .element(page.getByText('Paste form', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByText('Paste history', { exact: true }))
    .toBeVisible();
});
