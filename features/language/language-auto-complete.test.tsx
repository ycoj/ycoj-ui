import LanguageAutoComplete from './language-auto-complete';
import messages from '@/messages/en.json';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAvailableLanguages: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: {
    UI: {
      getAvailableLanguages: mocks.getAvailableLanguages,
    },
  },
}));

function methodResult<T>(value: T) {
  return { send: vi.fn().mockResolvedValue(value) };
}

const availableLanguages = {
  languages: {
    cc: {
      display: 'C++',
      versions: [
        { name: 'cc', display: 'C++' },
        { name: 'cc.cc17', display: 'C++17' },
      ],
    },
    python: {
      display: 'Python',
      versions: [{ name: 'python.py3', display: 'Python 3' }],
    },
  },
};

function Harness({ initialValue = [] }: { initialValue?: string[] }) {
  const [value, setValue] = useState(initialValue);

  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <LanguageAutoComplete
        id="langs"
        value={value}
        onValueChange={setValue}
        placeholder="Search languages"
        ariaLabel="Languages"
      />
      <button type="button" data-testid="next-field">
        Next field
      </button>
      <output data-testid="value">{JSON.stringify(value)}</output>
    </NextIntlClientProvider>
  );
}

async function flushFetch() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('LanguageAutoComplete', () => {
  beforeEach(() => {
    mocks.getAvailableLanguages.mockReturnValue(
      methodResult(availableLanguages)
    );
  });

  afterEach(() => {
    mocks.getAvailableLanguages.mockReset();
  });

  it('loads every language and lets the user pick several', async () => {
    render(<Harness />);
    await flushFetch();

    expect(mocks.getAvailableLanguages).toHaveBeenCalledWith();
    const input = screen.getByRole('combobox', { name: 'Languages' });
    fireEvent.mouseDown(input);

    expect(screen.getByText('C++ - C++17')).toBeInTheDocument();
    fireEvent.click(screen.getByText('C++ - C++17'));
    fireEvent.click(screen.getByText('Python - Python 3'));

    expect(screen.getByTestId('value')).toHaveTextContent(
      '["cc.cc17","python.py3"]'
    );
    expect(
      screen
        .getAllByRole('button', { name: /^Remove / })
        .map((button) => button.getAttribute('aria-label'))
    ).toEqual(['Remove C++ - C++17', 'Remove Python - Python 3']);
    expect(screen.getByRole('option', { name: /C\+\+ - C\+\+17/ })).toHaveClass(
      'bg-muted',
      'hover:bg-accent'
    );
    expect(
      screen.getByRole('option', { name: /Python - Python 3/ })
    ).toHaveClass('bg-muted', 'hover:bg-accent');
    expect(screen.getByRole('option', { name: 'C++ - C++ cc' })).toHaveClass(
      'hover:bg-accent'
    );
    expect(
      screen.getByRole('option', { name: 'C++ - C++ cc' })
    ).not.toHaveClass('bg-muted');
    expect(screen.getByRole('listbox').parentElement).toHaveClass(
      'min-w-[var(--anchor-width)]'
    );

    expect(screen.getByLabelText('C++ - C++17')).toHaveClass('bg-muted');
    expect(screen.getByLabelText('Python - Python 3')).toHaveClass('bg-muted');

    fireEvent.click(screen.getByRole('button', { name: 'Remove C++ - C++17' }));
    expect(screen.getByTestId('value')).toHaveTextContent('["python.py3"]');
  });

  it('closes the dropdown when the input loses focus', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await flushFetch();

    const input = screen.getByRole('combobox', { name: 'Languages' });
    await user.click(input);
    await user.type(input, 'py');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.click(screen.getByTestId('next-field'));
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('filters loaded languages as the user types', async () => {
    render(<Harness />);
    await flushFetch();

    const input = screen.getByRole('combobox', { name: 'Languages' });
    fireEvent.change(input, { target: { value: 'py3' } });

    expect(screen.getByText('Python - Python 3')).toBeInTheDocument();
    expect(screen.queryByText('C++ - C++17')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Python - Python 3'));
    expect(screen.getByTestId('value')).toHaveTextContent('["python.py3"]');
  });

  it('resolves existing values and marks unknown language ids invalid', async () => {
    render(<Harness initialValue={['cc.cc17', 'missing.lang']} />);
    await flushFetch();

    expect(
      screen
        .getAllByRole('button', { name: /^Remove / })
        .map((button) => button.getAttribute('aria-label'))
    ).toEqual(['Remove C++ - C++17', 'Remove missing.lang']);
    expect(screen.getByText('missing.lang (Invalid)')).toBeInTheDocument();
  });

  it('shows a load failure when languages cannot be fetched', async () => {
    mocks.getAvailableLanguages.mockReturnValue({
      send: vi.fn().mockRejectedValue(new Error('offline')),
    });

    render(<Harness />);
    await flushFetch();

    const input = screen.getByRole('combobox', { name: 'Languages' });
    fireEvent.mouseDown(input);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Could not load suggestions'
    );
  });
});
