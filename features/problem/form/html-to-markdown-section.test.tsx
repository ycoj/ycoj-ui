import HtmlToMarkdownSection from './html-to-markdown-section';
import type { ProblemFormValues } from './problem-form';
import messages from '@/messages/en.json';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  htmlToMarkdown: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: { Problem: { htmlToMarkdown: mocks.htmlToMarkdown } },
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
        control={control}
        getValues={getValues}
        setValue={setValue}
      />
    </NextIntlClientProvider>
  );
}

describe('HtmlToMarkdownSection', () => {
  beforeEach(() => {
    mocks.htmlToMarkdown.mockReset();
  });

  it('warns when conversion is launched after the statement has changed', async () => {
    const user = userEvent.setup();
    const send = vi.fn().mockResolvedValue({ markdown: '# converted' });
    mocks.htmlToMarkdown.mockReturnValue({ send });
    render(<Harness originalContent="# saved statement" />);

    await user.clear(screen.getByLabelText('statement'));
    await user.type(screen.getByLabelText('statement'), '# edited statement');
    await user.click(
      screen.getByRole('button', { name: 'Convert HTML to Markdown' })
    );

    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'You have unsaved edits. Conversion uses the last saved statement and will replace what you see now.'
    );
    expect(send).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Convert' }));
    await waitFor(() => expect(send).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByLabelText('statement')).toHaveValue('# converted')
    );
  });

  it('does not replace later edits made while conversion is pending', async () => {
    const user = userEvent.setup();
    let resolveConvert!: (value: { markdown: string }) => void;
    const send = vi.fn(
      () =>
        new Promise<{ markdown: string }>((resolve) => {
          resolveConvert = resolve;
        })
    );
    mocks.htmlToMarkdown.mockReturnValue({ send });
    render(<Harness originalContent="# saved statement" />);

    await user.click(
      screen.getByRole('button', { name: 'Convert HTML to Markdown' })
    );
    expect(send).toHaveBeenCalledTimes(1);

    await user.clear(screen.getByLabelText('statement'));
    await user.type(
      screen.getByLabelText('statement'),
      '# typed while pending'
    );

    await act(async () => {
      resolveConvert({ markdown: '# converted' });
    });

    await waitFor(() =>
      expect(
        screen.getByText(
          'The statement changed while conversion was running, so the result was not applied.'
        )
      ).toBeInTheDocument()
    );
    expect(screen.getByLabelText('statement')).toHaveValue(
      '# typed while pending'
    );
  });

  it('shows an extra warning when HTML conversion would replace unsaved edits', async () => {
    const user = userEvent.setup();
    mocks.htmlToMarkdown.mockReturnValue({
      send: vi.fn().mockResolvedValue({ markdown: '# converted' }),
    });
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
    const send = vi.fn().mockResolvedValue({
      error: {
        name: 'ValidationError',
        message: 'Field {0} must be {1}',
        params: ['email', 'unique'],
      },
    });
    mocks.htmlToMarkdown.mockReturnValue({ send });
    render(<Harness originalContent="# saved statement" />);

    await user.click(
      screen.getByRole('button', { name: 'Convert HTML to Markdown' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Field email must be unique'
    );
    expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
    expect(screen.getByLabelText('statement')).toHaveValue('# saved statement');
  });
});
