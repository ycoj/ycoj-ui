import ProblemDifficulty from './problem-difficulty';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

describe('ProblemDifficulty', () => {
  it('renders the label for a valid difficulty', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ProblemDifficulty difficulty={2} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Basic-')).toBeInTheDocument();
  });

  it('falls back to Unrated for missing or invalid difficulty', () => {
    const { rerender } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ProblemDifficulty />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Unrated')).toBeInTheDocument();

    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ProblemDifficulty difficulty={-1} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Unrated')).toBeInTheDocument();

    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ProblemDifficulty difficulty={99} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Unrated')).toBeInTheDocument();
  });

  it('renders Unrated for difficulty 0', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ProblemDifficulty difficulty={0} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Unrated')).toBeInTheDocument();
  });
});
