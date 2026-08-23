import AiGenerationForm from './ai-generation-form';
import messages from '@/messages/en.json';
import type { AiGenerationOptions } from '@/shared/types/ai-generation';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  push: vi.fn(),
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

vi.mock('@/api/client/method', () => ({
  default: { Problem: { generateAiTestdata: mocks.generate } },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('@/shared/components/code/code-editor', () => ({
  default: ({
    value,
    onChange,
    ariaLabel,
  }: {
    value: string;
    onChange?: (value: string) => void;
    ariaLabel?: string;
  }) => (
    <textarea
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

const options: AiGenerationOptions = {
  enabled: true,
  profiles: [{ id: 'quality', label: 'Quality', model: 'gpt-5.4' }],
  defaultProfileId: 'quality',
  defaultTarget: 20,
  maxWithoutChecker: 49,
  maxWithChecker: 48,
  timeLimitMs: 1500,
  memoryLimitMb: 512,
};

function renderForm(value = options) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AiGenerationForm pid="P1000" options={value} />
    </NextIntlClientProvider>
  );
}

describe('AiGenerationForm', () => {
  beforeEach(() => {
    mocks.generate.mockReset();
    mocks.push.mockReset();
  });

  it('submits the configured defaults and navigates to the live record', async () => {
    const user = userEvent.setup();
    const send = vi.fn().mockResolvedValue({ rid: 'record-id' });
    mocks.generate.mockReturnValue({ send });
    renderForm();

    await user.type(
      screen.getByPlaceholderText(/Add constraints/),
      'Prioritize overflow.'
    );
    await user.click(screen.getByRole('button', { name: 'Start generation' }));

    expect(mocks.generate).toHaveBeenCalledWith('P1000', {
      profileId: 'quality',
      testcaseTarget: 20,
      timeLimitMs: 1500,
      memoryLimitMb: 512,
      instructions: 'Prioritize overflow.',
      standardSolution: undefined,
      checker: undefined,
    });
    expect(mocks.push).toHaveBeenCalledWith('/record/record-id');
  });

  it('requires checker requirements and sends generated-checker settings', async () => {
    const user = userEvent.setup();
    const send = vi.fn().mockResolvedValue({ rid: 'record-id' });
    mocks.generate.mockReturnValue({ send });
    renderForm();

    await user.click(
      screen.getByLabelText('Use a custom Testlib C++17 checker')
    );
    await user.click(screen.getByRole('button', { name: 'Start generation' }));
    expect(
      screen.getByText('Describe the checker behavior to generate.')
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText('Checker requirements'),
      'Accept any valid witness.'
    );
    await user.click(screen.getByRole('button', { name: 'Start generation' }));
    expect(mocks.generate).toHaveBeenCalledWith(
      'P1000',
      expect.objectContaining({
        checker: {
          mode: 'generated',
          requirements: 'Accept any valid witness.',
        },
      })
    );
  });

  it('disables submission when generation is unavailable', () => {
    renderForm({ ...options, enabled: false });
    expect(screen.getByText('AI generation is disabled')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Start generation' })
    ).toBeDisabled();
  });
});
