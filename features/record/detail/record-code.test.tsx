import RecordCode from './record-code';
import messages from '@/messages/en.json';
import type { RecordDoc } from '@/shared/types/record';
import { createEvent, fireEvent, render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/lib/code-highlighter', () => ({
  highlightCodeToHtml: (code: string) => code,
}));

const rdoc = {
  _id: '66ab1234567890abcdef1234',
  domainId: 'system',
  pid: 1000,
  uid: 2,
  lang: 'cc.cc17',
  code: 'int main() {}',
  score: 0,
  memory: 0,
  time: 0,
  judgeTexts: [],
  compilerTexts: [],
  testCases: [],
  rejudged: false,
  judger: 0,
  judgeAt: '',
  status: 0,
} satisfies RecordDoc;

describe('RecordCode', () => {
  it('confines Ctrl+A to the code when the block is focused', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <div>
          <p>page copy</p>
          <RecordCode rdoc={rdoc} />
        </div>
      </NextIntlClientProvider>
    );

    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    pre!.focus();
    expect(pre).toHaveFocus();

    const event = createEvent.keyDown(pre!, { key: 'a', ctrlKey: true });
    fireEvent(pre!, event);

    expect(event.defaultPrevented).toBe(true);
    expect(window.getSelection()?.toString()).toBe('int main() {}');
  });
});
