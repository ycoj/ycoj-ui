import ClangdSettings from './clangd-settings';
import type { ClangdSupport } from './clangd-support';
import en from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('ClangdSettings', () => {
  beforeEach(() => {
    mocks.getClangdSupport.mockReset();
  });

  it('disables enabling when the browser cannot run the language server', () => {
    mocks.getClangdSupport.mockReturnValue('unsupported');
    renderSettings();

    expect(screen.getByRole('button', { name: labels.enable })).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: labels.enableReload })
    ).not.toBeInTheDocument();
  });

  it('offers the reload action when cross-origin isolation is missing', async () => {
    const user = userEvent.setup();
    mocks.getClangdSupport.mockReturnValue('reload');
    const props = renderSettings();

    await user.click(screen.getByRole('button', { name: labels.enableReload }));

    expect(props.onReload).toHaveBeenCalledOnce();
  });

  it('disables both actions and shows the saving label while reloading', () => {
    mocks.getClangdSupport.mockReturnValue('reload');
    renderSettings({ enabled: true, reloading: true });

    expect(screen.getByRole('button', { name: labels.saving })).toBeDisabled();
    expect(screen.getByRole('button', { name: labels.disable })).toBeDisabled();
  });

  it('disables the reload action until the scratchpad draft loads', async () => {
    const user = userEvent.setup();
    mocks.getClangdSupport.mockReturnValue('reload');
    const props = renderSettings({ draftPending: true });

    const button = screen.getByRole('button', { name: labels.enableReload });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(props.onReload).not.toHaveBeenCalled();
  });
});
