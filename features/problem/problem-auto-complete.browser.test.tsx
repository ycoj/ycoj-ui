import ProblemAutoComplete from './problem-auto-complete';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  searchProblems: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: { Problem: { searchProblems: mocks.searchProblems } },
}));

beforeEach(() => {
  mocks.searchProblems.mockReset();
});

test('resolves an existing numeric ID to the problem label', async () => {
  const send = vi.fn().mockResolvedValue({
    pdocs: [{ docId: 1000, pid: 'P1000', title: 'Binary Tree' }],
  });
  mocks.searchProblems.mockReturnValue({ send });

  await render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProblemAutoComplete
        domainId="system"
        value="1000"
        onValueChange={vi.fn()}
        ariaLabel="Problem ID"
      />
    </NextIntlClientProvider>
  );

  const input = page.getByRole('combobox', { name: 'Problem ID' });
  await expect.poll(() => mocks.searchProblems.mock.calls.length).toBe(1);
  expect(mocks.searchProblems).toHaveBeenCalledWith('system', '1000');
  await expect.element(input).toHaveValue('P1000 Binary Tree');

  await userEvent.click(input);
  await expect.element(input).toHaveValue('Binary Tree');
  await expect
    .poll(() => mocks.searchProblems.mock.calls.at(-1))
    .toEqual(['system', 'Binary Tree']);
});
