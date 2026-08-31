import PasteHistory from './paste-history';
import { pasteDoc, pasteOptions } from './paste.test-utils';
import messages from '@/messages/en.json';
import type { PasteDoc } from '@/shared/types/paste';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/paste',
  useSearchParams: () => new URLSearchParams('page=2'),
}));

function renderHistory(pdocs: PasteDoc[], totalPages = 1) {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={messages}
      timeZone="Asia/Shanghai"
    >
      <PasteHistory
        pdocs={pdocs}
        page={2}
        ppcount={totalPages}
        languageNames={pasteOptions.languageNames}
      />
    </NextIntlClientProvider>
  );
}

describe('paste history', () => {
  it('shows an empty state', () => {
    renderHistory([]);
    expect(screen.getByText('No snippets shared yet')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('uses ids for untitled pastes and backend total pages', () => {
    renderHistory([{ ...pasteDoc, title: '' }], 3);
    expect(screen.getByRole('link', { name: 'abc123' })).toHaveAttribute(
      'href',
      '/paste/abc123'
    );
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(document.querySelector('time')).toHaveAttribute(
      'datetime',
      pasteDoc.updatedAt
    );
    expect(screen.getByRole('link', { name: '3' })).toHaveAttribute(
      'href',
      '/paste?page=3'
    );
  });

  it('shows Markdown and custom language labels', () => {
    renderHistory([
      { ...pasteDoc, mode: 'markdown' },
      { ...pasteDoc, _id: 'custom', language: 'rust' },
    ]);
    expect(screen.getByText('Markdown')).toBeInTheDocument();
    expect(screen.getByText('rust')).toBeInTheDocument();
  });
});
