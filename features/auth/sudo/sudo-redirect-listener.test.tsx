import SudoRedirectListener from './sudo-redirect-listener';
import {
  navigateToSudo,
  SudoRedirectError,
} from '@/shared/lib/sudo-navigation';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));

describe('global sudo navigation listener', () => {
  it('navigates through Next routing and removes the listener on unmount', () => {
    const view = render(<SudoRedirectListener />);
    expect(() => navigateToSudo()).toThrow(SudoRedirectError);
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith('/user/sudo');
    view.unmount();
    expect(() => navigateToSudo()).toThrow(SudoRedirectError);
    expect(mocks.push).toHaveBeenCalledOnce();
  });
});
