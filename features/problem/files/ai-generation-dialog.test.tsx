import AiGenerationSection from './ai-generation-dialog';
import messages from '@/messages/en.json';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  push: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: {
    Problem: {
      generateAiTestdata: mocks.generate,
    },
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

function renderSection() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AiGenerationSection domainId="system" pid="1000" />
    </NextIntlClientProvider>
  );
}

describe('AiGenerationSection', () => {
  beforeEach(() => {
    mocks.generate.mockReset();
    mocks.push.mockReset();
  });

  it('renders the instructions inline without a dialog', () => {
    renderSection();

    expect(
      screen.getByRole('heading', { name: 'Generate with AI' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Instructions' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('submits documented args and navigates to the created record', async () => {
    const user = userEvent.setup();
    const send = vi.fn().mockResolvedValue({ rid: '66ab1234567890abcdef1234' });
    mocks.generate.mockReturnValue({ send });
    renderSection();

    await user.type(
      screen.getByRole('textbox', { name: 'Instructions' }),
      'Add chain cases'
    );
    await user.click(screen.getByRole('button', { name: 'Start generation' }));

    expect(mocks.generate).toHaveBeenCalledWith({
      domainId: 'system',
      id: '1000',
      instructions: 'Add chain cases',
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledWith('/record/66ab1234567890abcdef1234');
  });

  it('maps already-active and disabled errors', async () => {
    const user = userEvent.setup();
    const send = vi.fn().mockRejectedValue({
      name: 'AiGenerationAlreadyActiveError',
      code: 409,
    });
    mocks.generate.mockReturnValue({ send });
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Start generation' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'already has an active AI generation run'
    );

    send.mockRejectedValueOnce({
      name: 'AiGenerationDisabledError',
      code: 503,
    });
    await user.click(screen.getByRole('button', { name: 'Start generation' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'currently disabled'
    );
  });

  it('validates the instruction limit and disables submit while pending', async () => {
    const user = userEvent.setup();
    let resolve!: (value: { rid: string }) => void;
    const send = vi.fn().mockReturnValue(
      new Promise<{ rid: string }>((res) => {
        resolve = res;
      })
    );
    mocks.generate.mockReturnValue({ send });
    renderSection();

    const textarea = screen.getByRole('textbox', { name: 'Instructions' });
    fireEvent.change(textarea, { target: { value: 'a'.repeat(10_001) } });
    await user.click(screen.getByRole('button', { name: 'Start generation' }));
    expect(screen.getByRole('alert')).toHaveTextContent('10,000 characters');
    expect(mocks.generate).not.toHaveBeenCalled();

    fireEvent.change(textarea, { target: { value: 'valid request' } });
    await user.click(screen.getByRole('button', { name: 'Start generation' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Starting...' })).toBeDisabled()
    );
    resolve({ rid: 'rid' });
  });
});
