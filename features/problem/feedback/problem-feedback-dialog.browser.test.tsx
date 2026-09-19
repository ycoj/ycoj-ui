import ProblemFeedbackDialog from './problem-feedback-dialog';
import messages from '@/messages/en';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  submit: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: { Problem: { submitProblemFeedback: mocks.submit } },
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.success, error: mocks.error },
}));

function renderDialog() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProblemFeedbackDialog pid="P1000" tid="contest-id" />
    </NextIntlClientProvider>
  );
}

describe('ProblemFeedbackDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.submit.mockReturnValue({ send: vi.fn().mockResolvedValue({}) });
  });

  it('requires a description and submits trimmed feedback', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole('button', { name: 'Report an issue' }));
    const submit = screen.getByRole('button', { name: 'Submit feedback' });
    expect(submit).toBeDisabled();

    await user.type(
      screen.getByLabelText('Issue description'),
      '  The input limit is missing.  '
    );
    await user.click(submit);

    await waitFor(() =>
      expect(mocks.submit).toHaveBeenCalledWith(
        'P1000',
        'The input limit is missing.',
        'contest-id'
      )
    );
    expect(mocks.success).toHaveBeenCalledWith('Problem feedback submitted.');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
