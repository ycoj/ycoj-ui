import HtmlToMarkdownSection from '@/features/problem/form/html-to-markdown-section';
import type { ProblemFormValues } from '@/features/problem/form/problem-form';
import messages from '@/messages/en.json';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  submitHtmlToMarkdown: vi.fn(),
  pollHtmlToMarkdown: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: {
    Problem: {
      submitHtmlToMarkdown: mocks.submitHtmlToMarkdown,
      pollHtmlToMarkdown: mocks.pollHtmlToMarkdown,
    },
  },
}));

const defaultValues: ProblemFormValues = {
  pid: 'P1000',
  title: 'Title',
  tag: '',
  difficulty: 1,
  hidden: false,
  content: '',
};

function Harness({ originalContent }: { originalContent: string }) {
  const { control, getValues, setValue } = useForm<ProblemFormValues>({
    defaultValues: { ...defaultValues, content: originalContent },
  });
  const content = useWatch({ control, name: 'content' }) ?? '';

  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <textarea
        aria-label="statement"
        value={content}
        onChange={(event) =>
          setValue('content', event.target.value, { shouldDirty: true })
        }
      />
      <HtmlToMarkdownSection
        pid="P1000"
        originalContent={originalContent}
        content={content}
        getContent={() => getValues('content') ?? ''}
        onApply={(markdown) =>
          setValue('content', markdown, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      />
    </NextIntlClientProvider>
  );
}

describe('HtmlToMarkdownSection', () => {
  beforeEach(() => {
    mocks.submitHtmlToMarkdown.mockReset();
    mocks.pollHtmlToMarkdown.mockReset();
    vi.spyOn(toast, 'error').mockImplementation(() => '');
    vi.spyOn(toast, 'success').mockImplementation(() => '');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns when conversion is launched after the statement has changed', async () => {
    const user = userEvent.setup();
    const submitSend = vi
      .fn()
      .mockResolvedValue({ jobId: 'job-123', status: 'pending' });
    const pollSend = vi
      .fn()
      .mockResolvedValue({
        jobId: 'job-123',
        status: 'completed',
        markdown: '# converted',
      });
    mocks.submitHtmlToMarkdown.mockReturnValue({ send: submitSend });
    mocks.pollHtmlToMarkdown.mockReturnValue({ send: pollSend });
    render(<Harness originalContent="# saved statement" />);

    await user.clear(screen.getByLabelText('statement'));
    await user.type(screen.getByLabelText('statement'), '# edited statement');
    await user.click(
      screen.getByRole('button', { name: 'Convert HTML to Markdown' })
    );

    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'You have unsaved edits. Conversion uses the last saved statement and will replace what you see now.'
    );
    expect(submitSend).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Convert' }));

    await waitFor(() => expect(submitSend).toHaveBeenCalled());
    await waitFor(() => expect(pollSend).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByLabelText('statement')).toHaveValue('# converted')
    );
    expect(toast.success).toHaveBeenCalledWith(
      'Converted to Markdown. Review and save.'
    );
  });

  it('does not replace later edits made while conversion is pending', async () => {
    const user = userEvent.setup();
    const submitSend = vi
      .fn()
      .mockResolvedValue({ jobId: 'job-123', status: 'pending' });

    // First poll returns pending, second returns completed
    let pollCallCount = 0;
    const pollSend = vi.fn().mockImplementation(() => {
      pollCallCount++;
      if (pollCallCount === 1) {
        return Promise.resolve({ jobId: 'job-123', status: 'pending' });
      }
      return Promise.resolve({
        jobId: 'job-123',
        status: 'completed',
        markdown: '# converted',
      });
    });

    mocks.submitHtmlToMarkdown.mockReturnValue({ send: submitSend });
    mocks.pollHtmlToMarkdown.mockReturnValue({ send: pollSend });
    render(<Harness originalContent="# saved statement" />);

    const convertPromise = user.click(
      screen.getByRole('button', { name: 'Convert HTML to Markdown' })
    );
    await waitFor(() => expect(submitSend).toHaveBeenCalledTimes(1));

    // Wait for first poll call
    await waitFor(() => expect(pollSend).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    });

    await user.clear(screen.getByLabelText('statement'));
    await user.type(
      screen.getByLabelText('statement'),
      '# typed while pending'
    );

    // Wait for second poll to complete
    await waitFor(() => expect(pollSend).toHaveBeenCalledTimes(2), {
      timeout: 2000,
    });

    await convertPromise;

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'The statement changed while conversion was running, so the result was not applied.'
      )
    );
    expect(screen.getByLabelText('statement')).toHaveValue(
      '# typed while pending'
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('shows an extra warning when HTML conversion would replace unsaved edits', async () => {
    const user = userEvent.setup();
    const submitSend = vi
      .fn()
      .mockResolvedValue({ jobId: 'job-123', status: 'pending' });
    const pollSend = vi
      .fn()
      .mockResolvedValue({
        jobId: 'job-123',
        status: 'completed',
        markdown: '# converted',
      });
    mocks.submitHtmlToMarkdown.mockReturnValue({ send: submitSend });
    mocks.pollHtmlToMarkdown.mockReturnValue({ send: pollSend });
    render(<Harness originalContent="<p>saved</p>" />);

    await waitFor(() =>
      expect(screen.getByRole('alertdialog')).toHaveTextContent(
        'This problem statement contains HTML.'
      )
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await user.clear(screen.getByLabelText('statement'));
    await user.type(screen.getByLabelText('statement'), '<p>edited</p>');
    await user.click(
      screen.getByRole('button', { name: 'Convert HTML to Markdown' })
    );

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('This problem statement contains HTML.');
    expect(dialog).toHaveTextContent(
      'You have unsaved edits. Conversion uses the last saved statement and will replace what you see now.'
    );
  });

  it('displays parsed HydroError messages instead of [object Object]', async () => {
    const user = userEvent.setup();
    const submitSend = vi.fn().mockResolvedValue({
      error: {
        name: 'ValidationError',
        message: 'Field {0} must be {1}',
        params: ['email', 'unique'],
      },
    });
    mocks.submitHtmlToMarkdown.mockReturnValue({ send: submitSend });
    render(<Harness originalContent="# saved statement" />);

    await user.click(
      screen.getByRole('button', { name: 'Convert HTML to Markdown' })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Field email must be unique')
    );
    expect(toast.error).not.toHaveBeenCalledWith('[object Object]');
    expect(screen.getByLabelText('statement')).toHaveValue('# saved statement');
    expect(toast.success).not.toHaveBeenCalled();
  });
});
