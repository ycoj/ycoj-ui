import LandingPage from './landing-page';
import messages from '@/messages/en';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

beforeEach(() => {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches:
          query.includes('prefers-reduced-motion') ||
          query.includes('min-width'),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList
  );
});

function renderLandingPage() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LandingPage siteName="YCOJ" />
    </NextIntlClientProvider>
  );
}

describe('LandingPage', () => {
  it('presents the product story and working login calls to action', async () => {
    renderLandingPage();

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /move every line of code/i,
      })
    ).toBeVisible();
    expect(
      screen.getByRole('heading', {
        name: 'A seamless path from submit to insight',
      })
    ).toBeVisible();
    expect(
      screen.getByRole('heading', {
        name: 'Go beyond the verdict and understand the problem',
      })
    ).toBeVisible();
    expect(
      screen.getByRole('heading', {
        name: 'Practice, train, and compete in one place',
      })
    ).toBeVisible();

    const loginLinks = screen.getAllByRole('link', {
      name: /log in|start solving/i,
    });
    expect(loginLinks.length).toBeGreaterThanOrEqual(3);
    loginLinks.forEach((link) =>
      expect(link).toHaveAttribute('href', '/login')
    );
  });

  it('exposes each core platform capability as readable content', () => {
    renderLandingPage();

    const capabilityHeadings = [
      'Problem library',
      'Focused training',
      'Online contests',
      'Course homework',
      'Rankings and records',
      'Discussion and ideas',
    ];

    capabilityHeadings.forEach((name) => {
      expect(screen.getByRole('heading', { name })).toBeVisible();
    });

    const navigation = screen.getByRole('navigation', {
      name: 'Homepage navigation',
    });
    expect(
      within(navigation).getByRole('link', { name: 'Capabilities' })
    ).toHaveAttribute('href', '#capabilities');
  });
});
