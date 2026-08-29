import ProblemSample, { ProblemSampleActionProvider } from './problem-sample';
import messages from '@/messages/en.json';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

function renderSample(ui: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('ProblemSample', () => {
  it('renders copy controls without a sample action', () => {
    renderSample(
      <ProblemSample
        data-input={encodeURIComponent('1 2\n')}
        data-output={encodeURIComponent('3\n')}
      />
    );

    expect(screen.getAllByRole('button', { name: 'Copy' })).toHaveLength(2);
    expect(
      screen.queryByRole('button', { name: 'Use sample' })
    ).not.toBeInTheDocument();
  });

  it('runs a consumer-provided sample action with decoded input', () => {
    const onSelect = vi.fn();
    renderSample(
      <ProblemSampleActionProvider action={{ label: 'Use sample', onSelect }}>
        <ProblemSample
          data-input={encodeURIComponent('1 2\n')}
          data-output={encodeURIComponent('3\n')}
        />
      </ProblemSampleActionProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use sample' }));
    expect(onSelect).toHaveBeenCalledWith('1 2\n');
  });
});
