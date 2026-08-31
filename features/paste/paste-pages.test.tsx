import { pasteDoc, pasteOptions } from './paste.test-utils';
import EditPage, {
  generateMetadata as editMetadata,
} from '@/app/(app)/paste/[id]/edit/page';
import DetailPage, {
  generateMetadata as detailMetadata,
} from '@/app/(app)/paste/[id]/page';
import MainPage from '@/app/(app)/paste/page';
import messages from '@/messages/en.json';
import type { HydroError } from '@/shared/types/error';
import { render, screen } from '@testing-library/react';
import { createTranslator } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
vi.mock('@/features/paste/form/paste-form', () => ({
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

describe('paste page guards', () => {
  it.each(['NotFoundError', 'ForbiddenError', 'PrivilegeError'])(
    'renders %s safely in detail and metadata',
    async (name) => {
      mocks.detail.mockResolvedValue({
        error: { name, message: 'Unavailable' },
      });
      const props = { params: Promise.resolve({ id: 'abc123' }) };
      expect(await detailMetadata(props)).toEqual({ title: 'Share Snippets' });
      render(await DetailPage(props));
      expect(screen.getByRole('alert')).toHaveTextContent('Unavailable');
    }
  );

  it('does not render an edit form when backend access is denied', async () => {
    mocks.edit.mockResolvedValue({
      error: { name: 'ForbiddenError', message: 'Permission denied' },
    });
    const props = { params: Promise.resolve({ id: 'abc123' }) };
    expect(await editMetadata(props)).toEqual({ title: 'Edit snippet' });
    render(await EditPage(props));
    expect(screen.getByRole('alert')).toHaveTextContent('Permission denied');
    expect(screen.queryByText('Paste form')).toBeNull();
  });

  it('uses the document title and allows an authorized edit', async () => {
    mocks.edit.mockResolvedValue({ ...pasteOptions, pdoc: pasteDoc });
    const props = { params: Promise.resolve({ id: 'abc123' }) };
    expect(await editMetadata(props)).toEqual({
      title: 'Example - Edit snippet',
    });
    render(await EditPage(props));
    expect(screen.getByText('Paste form')).toBeInTheDocument();
  });

  it.each([undefined, '-1', '0', '2.5', 'invalid', ['2', '3']])(
    'normalizes invalid page %j',
    async (page) => {
      mocks.main.mockResolvedValue({
        ...pasteOptions,
        pdocs: [],
        page: 1,
        ppcount: 0,
        pcount: 0,
      });
      await MainPage({ searchParams: Promise.resolve({ page }) });
      expect(mocks.main).toHaveBeenCalledWith(1);
    }
  );

  it('keeps the create form and history together on later pages', async () => {
    mocks.main.mockResolvedValue({
      ...pasteOptions,
      pdocs: [pasteDoc],
      page: 2,
      ppcount: 3,
      pcount: 45,
    });
    render(await MainPage({ searchParams: Promise.resolve({ page: '2' }) }));
    expect(mocks.main).toHaveBeenCalledWith(2);
    expect(screen.getByText('Paste form')).toBeInTheDocument();
    expect(screen.getByText('Paste history')).toBeInTheDocument();
  });
});
