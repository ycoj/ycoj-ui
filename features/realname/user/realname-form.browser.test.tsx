import RealnameForm from '@/features/realname/user/realname-form';
import messages from '@/messages/en.json';
import type { RealnamePageData } from '@/shared/types/realname';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  submitRealname: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock('@/api/client/method', () => ({
  default: { Realname: { submitRealname: mocks.submitRealname } },
}));

const data: RealnamePageData = {
  page_name: 'home_realname',
  status: 'pending',
  exempt: false,
  application: null,
  inGrace: true,
  graceUntil: '2026-08-08T00:00:00.000Z',
  realName: 'Alice Zhang',
  school: 'Example High School',
};

function renderForm(overrides: Partial<RealnamePageData> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <RealnameForm data={{ ...data, ...overrides }} />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

test('prefills and submits the legal name and school', async () => {
  const send = vi.fn().mockResolvedValue({ url: '/home/realname/result' });
  mocks.submitRealname.mockReturnValue({ send });
  await renderForm();

  await expect
    .element(page.getByLabelText('Legal name'))
    .toHaveValue('Alice Zhang');
  await expect
    .element(page.getByLabelText('School'))
    .toHaveValue('Example High School');

  await userEvent.click(
    page.getByRole('button', { name: 'Update verification' })
  );

  await expect
    .poll(() => mocks.submitRealname.mock.calls.length)
    .toBeGreaterThan(0);
  expect(mocks.submitRealname).toHaveBeenCalledWith({
    realName: 'Alice Zhang',
    school: 'Example High School',
  });
  expect(send).toHaveBeenCalledOnce();
  await expect.poll(() => mocks.push.mock.calls.length).toBe(1);
  expect(mocks.push).toHaveBeenCalledWith('/home/realname/result');
  expect(mocks.refresh).toHaveBeenCalledOnce();
});

test('validates both fields before sending', async () => {
  await renderForm({ realName: '', school: '' });

  await userEvent.click(
    page.getByRole('button', { name: 'Update verification' })
  );

  await expect
    .element(
      page.getByText('Legal name must be at least 2 characters', {
        exact: true,
      })
    )
    .toBeVisible();
  await expect
    .element(
      page.getByText('School name must be at least 2 characters', {
        exact: true,
      })
    )
    .toBeVisible();
  expect(mocks.submitRealname).not.toHaveBeenCalled();
});

test('shows a rejected reason and reports request failures', async () => {
  mocks.submitRealname.mockReturnValue({
    send: vi.fn().mockRejectedValue(new Error('Rate limit exceeded')),
  });
  await renderForm({
    status: 'rejected',
    application: {
      _id: 'application-id',
      uid: 2,
      realName: 'Alice Zhang',
      school: 'Example High School',
      status: 'rejected',
      submittedAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-02T00:00:00.000Z',
      rejectReason: 'Name does not match',
    },
  });

  await expect
    .element(page.getByText('Reason: Name does not match', { exact: true }))
    .toBeVisible();

  await userEvent.click(
    page.getByRole('button', { name: 'Update verification' })
  );

  const alert = page.getByText('Rate limit exceeded', { exact: true });
  await expect.element(alert).toBeVisible();
  expect(alert.element().closest('[role="alert"]')).not.toBeNull();
});
