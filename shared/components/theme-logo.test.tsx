import ThemeLogo from '@/shared/components/theme-logo';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('ThemeLogo', () => {
  it.each([undefined, 'lazy'] as const)(
    'applies loading=%s to both theme images',
    (loading) => {
      render(
        <ThemeLogo alt="Logo" width={290} height={87} loading={loading} />
      );

      const images = screen.getAllByRole('img', { name: 'Logo' });
      expect(images).toHaveLength(2);
      for (const image of images) {
        expect(image).toHaveAttribute('loading', loading ?? 'lazy');
      }
      expect(images[0]).toHaveClass('dark:hidden');
      expect(images[1]).toHaveClass('hidden', 'dark:block');
    }
  );

  it('forwards fetchPriority without changing default lazy loading', () => {
    render(
      <ThemeLogo alt="Logo" width={290} height={87} fetchPriority="high" />
    );

    const images = screen.getAllByRole('img', { name: 'Logo' });
    expect(images).toHaveLength(2);
    for (const image of images) {
      expect(image).toHaveAttribute('loading', 'lazy');
      expect(image).toHaveAttribute('fetchpriority', 'high');
    }
  });
});
