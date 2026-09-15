import RecordCode from './record-code';
import messages from '@/messages/en';
import type { RecordDoc } from '@/shared/types/record';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';

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

test('renders highlighted code and confines Ctrl+A to the code block', async () => {
  const { container } = await render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <div>
        <p>page copy</p>
        <RecordCode rdoc={rdoc} />
      </div>
    </NextIntlClientProvider>
  );

  const pre = container.querySelector('pre');
  expect(pre).not.toBeNull();
  expect(pre!.textContent).toBe('int main() {}');
  expect(pre!.querySelectorAll('span').length).toBeGreaterThan(0);

  pre!.focus();
  expect(document.activeElement).toBe(pre);
  await userEvent.keyboard('{Control>}a{/Control}');

  const selected = window.getSelection()?.toString() ?? '';
  expect(selected).toBe('int main() {}');
  expect(selected).not.toContain('page copy');
});

test('renders nothing without code or language', async () => {
  const { container } = await render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <RecordCode rdoc={{ ...rdoc, code: '' }} />
    </NextIntlClientProvider>
  );

  expect(container.querySelector('pre')).toBeNull();
  expect(container.querySelector('[data-slot="card"]')).toBeNull();
});
