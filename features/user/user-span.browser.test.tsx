import UserSpan from './user-span';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

test('renders the CCF hook after the username', async () => {
  await render(
    <UserSpan
      user={{
        _id: 2,
        uname: 'alice',
        mail: 'alice@example.com',
        avatar: '',
        ccfLevel: 6,
      }}
      showAvatar={false}
    />
  );

  const username = page.getByText('alice', { exact: true });
  const hook = page.getByRole('img', { name: 'CCF 6' });
  await expect.element(username).toBeVisible();
  await expect.element(hook).toBeVisible();

  const usernameBounds = username.element().getBoundingClientRect();
  const hookBounds = hook.element().getBoundingClientRect();
  expect(hookBounds.left).toBeGreaterThanOrEqual(usernameBounds.right);
  expect(hookBounds.width).toBe(16);
  expect(hookBounds.height).toBe(16);
  expect(hook.element().getAttribute('src')).toContain('ccf-hook-blue.png');
});

test('links to the user profile and renders the avatar when requested', async () => {
  await render(
    <UserSpan
      user={{
        _id: 2,
        uname: 'alice',
        mail: 'alice@example.com',
        avatar: '',
        ccfLevel: 2,
      }}
    />
  );

  const link = page.getByRole('link');
  await expect.element(link).toBeVisible();
  expect(link.element().getAttribute('href')).toBe('/user/2');
  await expect
    .element(page.getByRole('img', { name: 'CCF 2' }))
    .not.toBeInTheDocument();
});
