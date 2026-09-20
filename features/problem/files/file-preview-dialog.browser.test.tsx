import FilePreviewDialog from './file-preview-dialog';
import messages from '@/messages/en';
import type { FileInfo } from '@/shared/types/file';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

const file: FileInfo = {
  _id: 'diagram',
  name: 'diagram.png',
  size: 100,
  etag: 'diagram-etag',
  lastModified: new Date(),
};

function renderDialog(onOpenChange = vi.fn()) {
  return {
    onOpenChange,
    ...render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <FilePreviewDialog
          file={file}
          type="image"
          url="https://files.example/diagram.png"
          loading={false}
          error=""
          onOpenChange={onOpenChange}
        />
      </NextIntlClientProvider>
    ),
  };
}

describe('FilePreviewDialog', () => {
  it('renders a read-only image preview and closes from the dialog button', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    expect(screen.getByRole('dialog')).toHaveTextContent(
      /Preview:\s*diagram\.png/
    );
    expect(screen.getByRole('img', { name: 'diagram.png' })).toHaveAttribute(
      'src',
      'https://files.example/diagram.png'
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
