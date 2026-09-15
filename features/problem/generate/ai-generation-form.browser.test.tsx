import AiGenerationForm from './ai-generation-form';
import messages from '@/messages/en.json';
import type { AiGenerationOptions } from '@/shared/types/ai-generation';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  push: vi.fn(),
}));

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

beforeEach(() => {
  mocks.generate.mockReset();
  mocks.push.mockReset();
});

test('submits the configured defaults and navigates to the live record', async () => {
  const send = vi.fn().mockResolvedValue({ rid: 'record-id' });
  mocks.generate.mockReturnValue({ send });
  await renderForm();

  await userEvent.type(
    page.getByPlaceholder(/Add constraints/),
    'Prioritize overflow.'
  );
  await userEvent.click(page.getByRole('button', { name: 'Start generation' }));

  await expect.poll(() => mocks.generate.mock.calls.length).toBe(1);
  expect(mocks.generate).toHaveBeenCalledWith('P1000', {
    profileId: 'quality',
    testcaseTarget: 20,
    timeLimitMs: 1500,
    memoryLimitMb: 512,
    instructions: 'Prioritize overflow.',
    standardSolution: undefined,
    checker: undefined,
  });
  await expect.poll(() => mocks.push.mock.calls.length).toBe(1);
  expect(mocks.push).toHaveBeenCalledWith('/record/record-id');
});

test('requires checker requirements and sends generated-checker settings', async () => {
  const send = vi.fn().mockResolvedValue({ rid: 'record-id' });
  mocks.generate.mockReturnValue({ send });
  await renderForm();

  await userEvent.click(
    page.getByLabelText('Use a custom Testlib C++17 checker')
  );
  await userEvent.click(page.getByRole('button', { name: 'Start generation' }));

  await expect
    .element(
      page.getByText('Describe the checker behavior to generate.', {
        exact: true,
      })
    )
    .toBeVisible();

  await userEvent.type(
    page.getByLabelText('Checker requirements'),
    'Accept any valid witness.'
  );
  await userEvent.click(page.getByRole('button', { name: 'Start generation' }));

  await expect.poll(() => mocks.generate.mock.calls.length).toBe(1);
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

test('ignores stale oversized checker source after switching to generated mode', async () => {
  const send = vi.fn().mockResolvedValue({ rid: 'record-id' });
  mocks.generate.mockReturnValue({ send });
  await renderForm();

  await userEvent.click(
    page.getByLabelText('Use a custom Testlib C++17 checker')
  );
  await userEvent.click(page.getByRole('combobox', { name: 'Checker source' }));
  await userEvent.click(
    page.getByRole('option', { name: 'Provide source code' })
  );
  await userEvent.fill(
    page.getByRole('textbox', { name: 'Testlib checker source' }),
    'x'.repeat(100_001)
  );

  await userEvent.click(page.getByRole('combobox', { name: 'Checker source' }));
  await userEvent.click(page.getByRole('option', { name: 'Generate with AI' }));
  await userEvent.type(
    page.getByLabelText('Checker requirements'),
    'Accept any valid witness.'
  );
  await userEvent.click(page.getByRole('button', { name: 'Start generation' }));

  await expect
    .element(
      page.getByText('Source code must be 100,000 characters or fewer.', {
        exact: true,
      })
    )
    .not.toBeInTheDocument();
  await expect.poll(() => mocks.generate.mock.calls.length).toBe(1);
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

test('disables submission when generation is unavailable', async () => {
  await renderForm({ ...options, enabled: false });

  await expect
    .element(page.getByText('AI generation is disabled', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Start generation' }))
    .toBeDisabled();
});
