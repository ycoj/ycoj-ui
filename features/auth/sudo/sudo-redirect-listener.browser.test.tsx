import SudoRedirectListener from './sudo-redirect-listener';
import {
  navigateToSudo,
  SudoRedirectError,
} from '@/shared/lib/sudo-navigation';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));

test('navigates through Next routing and removes the listener on unmount', async () => {
  const view = await render(<SudoRedirectListener />);
  expect(() => navigateToSudo()).toThrow(SudoRedirectError);
  expect(mocks.push).toHaveBeenCalledExactlyOnceWith('/user/sudo');
  await view.unmount();
  expect(() => navigateToSudo()).toThrow(SudoRedirectError);
  expect(mocks.push).toHaveBeenCalledOnce();
});
