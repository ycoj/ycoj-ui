import FileSection from './file-section';
import messages from '@/messages/en';
import type { FileInfo } from '@/shared/types/file';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

const files: FileInfo[] = [
  {
    _id: 'image',
    name: 'diagram.png',
    size: 100,
    etag: 'image-etag',
    lastModified: new Date(),
  },
  {
    _id: 'pdf',
    name: 'statement.pdf',
    size: 200,
    etag: 'pdf-etag',
    lastModified: new Date(),
  },
  {
    _id: 'pptx',
    name: 'slides.pptx',
    size: 300,
    etag: 'pptx-etag',
    lastModified: new Date(),
  },
  {
    _id: 'text',
    name: 'notes.txt',
    size: 400,
    etag: 'text-etag',
    lastModified: new Date(),
  },
];

function renderFileSection(
  onPreview: (
    type: 'additional_file',
    file: FileInfo,
    previewType: 'image' | 'pdf' | 'pptx'
  ) => void
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <FileSection
        type="additional_file"
        files={files}
        canManage={false}
        onUpload={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn()}
        onDownload={vi.fn()}
        onPreview={onPreview}
        uploading={false}
        deleting={false}
      />
    </NextIntlClientProvider>
  );
}

describe('FileSection previews', () => {
  it('opens preview callbacks for image, PDF, and PPTX files', async () => {
    const user = userEvent.setup();
    const onPreview = vi.fn();
    renderFileSection(onPreview);

    await user.click(
      screen.getByRole('button', { name: 'Preview file diagram.png' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Preview file statement.pdf' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Preview file slides.pptx' })
    );

    expect(onPreview).toHaveBeenNthCalledWith(
      1,
      'additional_file',
      files[0],
      'image'
    );
    expect(onPreview).toHaveBeenNthCalledWith(
      2,
      'additional_file',
      files[1],
      'pdf'
    );
    expect(onPreview).toHaveBeenNthCalledWith(
      3,
      'additional_file',
      files[2],
      'pptx'
    );
    expect(
      screen.queryByRole('button', { name: 'Preview file notes.txt' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('notes.txt')).toBeInTheDocument();
  });
});
