import CcfHook from './ccf-hook';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

test.each([
  [3, 'green'],
  [4, 'green'],
  [6, 'blue'],
  [7, 'blue'],
  [9, 'gold'],
  [10, 'gold'],
] as const)(
  'renders the %i-level hook with the %s asset',
  async (level, color) => {
    await render(<CcfHook level={level} />);

    const hook = page.getByRole('img', { name: `CCF ${level}` });
    await expect.element(hook).toBeVisible();
    expect(hook.element().getAttribute('src')).toContain(
      `ccf-hook-${color}.png`
    );
    const bounds = hook.element().getBoundingClientRect();
    expect(bounds.width).toBe(16);
    expect(bounds.height).toBe(16);
  }
);

test.each([undefined, 0, 2] as const)(
  'hides levels below 3 (%s)',
  async (level) => {
    await render(<CcfHook level={level} />);

    await expect.poll(() => document.querySelectorAll('img').length).toBe(0);
  }
);
