import CodeCopyButton from './code-copy-button';
import messages from '@/messages/en.json';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return writeText;
}

function renderButton(text = 'int main() {}') {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <div className="relative">
        <CodeCopyButton text={text} />
      </div>
    </NextIntlClientProvider>
  );
}

describe('CodeCopyButton', () => {
  it('copies text and shows the copied label', async () => {
    const writeText = mockClipboard();

    renderButton();
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(writeText).toHaveBeenCalledWith('int main() {}');
    expect(
      await screen.findByRole('button', { name: 'Copied' })
    ).toBeInTheDocument();
  });

  it('renders the overlay variant used by markdown code blocks', async () => {
    const writeText = mockClipboard();

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CodeCopyButton text="printf" variant="inline" />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(writeText).toHaveBeenCalledWith('printf');
    expect(
      await screen.findByRole('button', { name: 'Copied' })
    ).toBeInTheDocument();
  });

  it('keeps the copy label when clipboard write is rejected', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    renderButton();
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('int main() {}');
    });
    await expect(writeText.mock.results[0]?.value).rejects.toThrow('denied');
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Copied' })
    ).not.toBeInTheDocument();
  });
});
