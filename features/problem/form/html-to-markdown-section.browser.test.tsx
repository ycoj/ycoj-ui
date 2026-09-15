import HtmlToMarkdownSection from '@/features/problem/form/html-to-markdown-section';
import type { ProblemFormValues } from '@/features/problem/form/problem-form';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import { act } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

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

function statement() {
  return page.getByLabelText('statement');
}

function convertButton() {
  return page.getByRole('button', { name: 'Convert HTML to Markdown' });
}

beforeEach(() => {
  mocks.submitHtmlToMarkdown.mockReset();
  mocks.pollHtmlToMarkdown.mockReset();
  vi.spyOn(toast, 'error').mockImplementation(() => '');
  vi.spyOn(toast, 'success').mockImplementation(() => '');
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('warns when conversion is launched after the statement has changed', async () => {
  const submitSend = vi
    .fn()
    .mockResolvedValue({ jobId: 'job-123', status: 'pending' });
  const pollSend = vi.fn().mockResolvedValue({
    jobId: 'job-123',
    status: 'completed',
    markdown: '# converted',
  });
  mocks.submitHtmlToMarkdown.mockReturnValue({ send: submitSend });
  mocks.pollHtmlToMarkdown.mockReturnValue({ send: pollSend });
  await render(<Harness originalContent="# saved statement" />);

  await userEvent.fill(statement(), '# edited statement');
  await userEvent.click(convertButton());

  const dialog = page.getByRole('alertdialog');
  await expect.element(dialog).toBeVisible();
  await expect
    .element(dialog)
    .toHaveTextContent(
      'You have unsaved edits. Conversion uses the last saved statement and will replace what you see now.'
    );
  expect(submitSend).not.toHaveBeenCalled();

  await userEvent.click(
    dialog.getByRole('button', { name: 'Convert', exact: true })
  );

  await expect.poll(() => submitSend.mock.calls.length).toBe(1);
  await expect
    .poll(() => pollSend.mock.calls.length, { timeout: 3000 })
    .toBeGreaterThan(0);
  await expect.element(statement()).toHaveValue('# converted');
  expect(toast.success).toHaveBeenCalledWith(
    'Converted to Markdown. Review and save.'
  );
});

test('does not replace later edits made while conversion is pending', async () => {
  const submitSend = vi
    .fn()
    .mockResolvedValue({ jobId: 'job-123', status: 'pending' });

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
  await render(<Harness originalContent="# saved statement" />);

  await userEvent.click(convertButton());
  await expect.poll(() => submitSend.mock.calls.length).toBe(1);
  await expect
    .poll(() => pollSend.mock.calls.length, { timeout: 3000 })
    .toBeGreaterThan(0);

  await userEvent.fill(statement(), '# typed while pending');
  await expect
    .poll(() => pollSend.mock.calls.length, { timeout: 3000 })
    .toBe(2);

  await expect.poll(() => vi.mocked(toast.error).mock.calls.length).toBe(1);
  expect(toast.error).toHaveBeenCalledWith(
    'The statement changed while conversion was running, so the result was not applied.'
  );
  await expect.element(statement()).toHaveValue('# typed while pending');
  expect(toast.success).not.toHaveBeenCalled();
});

test('times out and aborts a poll request that never settles', async () => {
  vi.useFakeTimers();
  try {
    const submitSend = vi
      .fn()
      .mockResolvedValue({ jobId: 'job-123', status: 'pending' });
    const pollAbort = vi.fn();
    const pollSend = vi.fn().mockImplementation(() => new Promise(() => {}));
    mocks.submitHtmlToMarkdown.mockReturnValue({ send: submitSend });
    mocks.pollHtmlToMarkdown.mockReturnValue({
      send: pollSend,
      abort: pollAbort,
    });
    await render(<Harness originalContent="# saved statement" />);

    await page
      .getByRole('button', { name: 'Convert HTML to Markdown' })
      .click();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(pollSend).toHaveBeenCalledTimes(1);
    expect(pollAbort).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith(
      'Conversion timed out. Please try again.'
    );
  } finally {
    vi.useRealTimers();
  }
});

test('shows an extra warning when HTML conversion would replace unsaved edits', async () => {
  const submitSend = vi
    .fn()
    .mockResolvedValue({ jobId: 'job-123', status: 'pending' });
  const pollSend = vi.fn().mockResolvedValue({
    jobId: 'job-123',
    status: 'completed',
    markdown: '# converted',
  });
  mocks.submitHtmlToMarkdown.mockReturnValue({ send: submitSend });
  mocks.pollHtmlToMarkdown.mockReturnValue({ send: pollSend });
  await render(<Harness originalContent="<p>saved</p>" />);

  const dialog = page.getByRole('alertdialog');
  await expect.element(dialog).toBeVisible();
  await expect
    .element(dialog)
    .toHaveTextContent('This problem statement contains HTML.');
  await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));

  await userEvent.fill(statement(), '<p>edited</p>');
  await userEvent.click(convertButton());

  await expect.element(dialog).toBeVisible();
  await expect
    .element(dialog)
    .toHaveTextContent('This problem statement contains HTML.');
  await expect
    .element(dialog)
    .toHaveTextContent(
      'You have unsaved edits. Conversion uses the last saved statement and will replace what you see now.'
    );
});

test('displays parsed HydroError messages instead of [object Object]', async () => {
  const submitSend = vi.fn().mockResolvedValue({
    error: {
      name: 'ValidationError',
      message: 'Field {0} must be {1}',
      params: ['email', 'unique'],
    },
  });
  mocks.submitHtmlToMarkdown.mockReturnValue({ send: submitSend });
  await render(<Harness originalContent="# saved statement" />);

  await userEvent.click(convertButton());

  await expect
    .poll(() => vi.mocked(toast.error).mock.calls.length)
    .toBeGreaterThan(0);
  expect(toast.error).toHaveBeenCalledWith('Field email must be unique');
  expect(toast.error).not.toHaveBeenCalledWith('[object Object]');
  await expect.element(statement()).toHaveValue('# saved statement');
  expect(toast.success).not.toHaveBeenCalled();
});
