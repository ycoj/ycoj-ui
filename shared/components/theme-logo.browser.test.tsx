import ThemeLogo from '@/shared/components/theme-logo';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

function logoImages() {
  return page.getByRole('img', { name: 'Logo', includeHidden: true });
}

test('shows the matching logo for the active color theme', async () => {
  await render(<ThemeLogo alt="Logo" width={290} height={87} />);

  const images = logoImages();
  await expect.element(images.nth(0)).toBeVisible();
  await expect.element(images.nth(1)).not.toBeVisible();
  const lightBounds = images.nth(0).element().getBoundingClientRect();
  expect(lightBounds.width).toBe(290);
  expect(lightBounds.height).toBe(87);
  expect(images.nth(0).element().getAttribute('src')).toContain(
    'nav-logo-small_light.png'
  );

  document.documentElement.classList.add('dark');
  await expect.element(images.nth(0)).not.toBeVisible();
  await expect.element(images.nth(1)).toBeVisible();
  const darkBounds = images.nth(1).element().getBoundingClientRect();
  expect(darkBounds.width).toBe(290);
  expect(darkBounds.height).toBe(87);
  expect(images.nth(1).element().getAttribute('src')).toContain(
    'nav-logo-small_dark.png'
  );
});

test('keeps deferred loading and fetch priority on both rendered images', async () => {
  await render(
    <ThemeLogo alt="Logo" width={290} height={87} fetchPriority="high" />
  );

  const images = logoImages();
  for (const image of [images.nth(0), images.nth(1)]) {
    await expect.element(image).toHaveAttribute('loading', 'lazy');
    await expect.element(image).toHaveAttribute('fetchpriority', 'high');
    expect(image.element().getAttribute('decoding')).toBe('async');
  }
});
