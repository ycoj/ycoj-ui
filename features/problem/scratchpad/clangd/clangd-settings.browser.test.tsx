import ClangdSettings from './clangd-settings';
import type { ClangdSupport } from './clangd-support';
import en from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  getClangdSupport: vi.fn<() => ClangdSupport>(),
}));

vi.mock('./clangd-support', () => ({
  getClangdSupport: mocks.getClangdSupport,
}));

const labels = en.problem.scratchpad.clangd;

type Props = ComponentProps<typeof ClangdSettings>;

function renderSettings(overrides: Partial<Props> = {}) {
  const props: Props = {
    enabled: false,
    onChange: vi.fn(),
    reloading: false,
    draftPending: false,
    onReload: vi.fn(() => Promise.resolve()),
    ...overrides,
  };
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ClangdSettings {...props} />
    </NextIntlClientProvider>
  );
  return props;
}

beforeEach(() => {
  mocks.getClangdSupport.mockReset();
});

test('disables enabling when the browser cannot run the language server', async () => {
  mocks.getClangdSupport.mockReturnValue('unsupported');
  renderSettings();

  await expect
    .element(page.getByRole('button', { name: labels.enable }))
    .toBeDisabled();
  await expect
    .element(page.getByRole('button', { name: labels.enableReload }))
    .not.toBeInTheDocument();
});

test('offers the reload action when cross-origin isolation is missing', async () => {
  mocks.getClangdSupport.mockReturnValue('reload');
  const props = renderSettings();

  await userEvent.click(
    page.getByRole('button', { name: labels.enableReload })
  );

  expect(props.onReload).toHaveBeenCalledOnce();
});

test('disables both actions and shows the saving label while reloading', async () => {
  mocks.getClangdSupport.mockReturnValue('reload');
  renderSettings({ enabled: true, reloading: true });

  await expect
    .element(page.getByRole('button', { name: labels.saving }))
    .toBeDisabled();
  await expect
    .element(page.getByRole('button', { name: labels.disable }))
    .toBeDisabled();
});

test('disables the reload action until the scratchpad draft loads', async () => {
  mocks.getClangdSupport.mockReturnValue('reload');
  const props = renderSettings({ draftPending: true });

  const button = page.getByRole('button', { name: labels.enableReload });
  await expect.element(button).toBeDisabled();
  await expect.element(button).toBeDisabled();
  expect(props.onReload).not.toHaveBeenCalled();
});
