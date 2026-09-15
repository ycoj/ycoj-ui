import LanguageAutoComplete from './language-auto-complete';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

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

function input() {
  return page.getByRole('combobox', { name: 'Languages' });
}

function valueOutput() {
  return page.getByTestId('value');
}

beforeEach(() => {
  mocks.getAvailableLanguages.mockReset();
  mocks.getAvailableLanguages.mockReturnValue(methodResult(availableLanguages));
});

test('lets the user search for and select several languages', async () => {
  await render(<Harness />);

  await expect
    .poll(() => mocks.getAvailableLanguages.mock.calls.length)
    .toBeGreaterThan(0);
  const combobox = input();
  await userEvent.click(combobox);
  await expect
    .element(page.getByRole('listbox', { includeHidden: true }))
    .toBeVisible();

  await userEvent.click(page.getByRole('option', { name: /C\+\+ - C\+\+17/ }));
  await userEvent.click(
    page.getByRole('option', { name: /Python - Python 3/ })
  );

  await expect
    .element(valueOutput())
    .toHaveTextContent('["cc.cc17","python.py3"]');
  await expect
    .element(page.getByRole('button', { name: 'Remove C++ - C++17' }))
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Remove Python - Python 3' }))
    .toBeVisible();
});

test('anchors the suggestion list to the input width', async () => {
  await render(<Harness />);
  await expect
    .poll(() => mocks.getAvailableLanguages.mock.calls.length)
    .toBeGreaterThan(0);

  const combobox = input();
  await userEvent.click(combobox);
  const listbox = page.getByRole('listbox');
  await expect.element(listbox).toBeVisible();

  const anchor = combobox.element().closest('[data-llm-visible]')!;
  await expect
    .poll(() => {
      const anchorBounds = anchor.getBoundingClientRect();
      const listBounds = listbox.element().getBoundingClientRect();
      return Math.abs(listBounds.left - anchorBounds.left);
    })
    .toBeLessThanOrEqual(6);
  const anchorBounds = anchor.getBoundingClientRect();
  const listBounds = listbox.element().getBoundingClientRect();
  expect(listBounds.width).toBeGreaterThanOrEqual(anchorBounds.width - 1);
  expect(listBounds.top).toBeGreaterThanOrEqual(anchorBounds.bottom);
});

test('marks selected options and chips with a filled background', async () => {
  await render(<Harness initialValue={['cc.cc17']} />);
  await expect
    .poll(() => mocks.getAvailableLanguages.mock.calls.length)
    .toBeGreaterThan(0);

  const chip = page.getByLabelText('C++ - C++17', { exact: true });
  await expect.element(chip).toBeVisible();
  await expect
    .poll(() => getComputedStyle(chip.element()).backgroundColor)
    .not.toBe('rgba(0, 0, 0, 0)');

  await userEvent.click(input());
  const selected = page.getByRole('option', { name: /C\+\+ - C\+\+17/ });
  const unselected = page.getByRole('option', { name: 'C++ - C++ cc' });
  await expect.element(selected).toBeVisible();
  await expect.element(unselected).toBeVisible();
  await expect
    .poll(() => getComputedStyle(selected.element()).backgroundColor)
    .not.toBe(getComputedStyle(unselected.element()).backgroundColor);
});

test('removes a selected language from its chip', async () => {
  await render(<Harness initialValue={['cc.cc17', 'python.py3']} />);
  await expect
    .poll(() => mocks.getAvailableLanguages.mock.calls.length)
    .toBeGreaterThan(0);

  await expect
    .element(page.getByLabelText('Python - Python 3', { exact: true }))
    .toBeVisible();
  await userEvent.click(
    page.getByRole('button', { name: 'Remove C++ - C++17' })
  );

  await expect.element(valueOutput()).toHaveTextContent('["python.py3"]');
  await expect
    .element(page.getByLabelText('C++ - C++17', { exact: true }))
    .not.toBeInTheDocument();
});

test('filters the loaded languages as the user types', async () => {
  await render(<Harness />);
  await expect
    .poll(() => mocks.getAvailableLanguages.mock.calls.length)
    .toBeGreaterThan(0);

  const combobox = input();
  await userEvent.click(combobox);
  await userEvent.type(combobox, 'py3');

  const python = page.getByRole('option', { name: /Python - Python 3/ });
  await expect.element(python).toBeVisible();
  await expect
    .element(page.getByRole('option', { name: /C\+\+ - C\+\+17/ }))
    .not.toBeInTheDocument();

  await userEvent.click(python);
  await expect.element(valueOutput()).toHaveTextContent('["python.py3"]');
});

test('marks unknown existing values as invalid', async () => {
  await render(<Harness initialValue={['cc.cc17', 'missing.lang']} />);
  await expect
    .poll(() => mocks.getAvailableLanguages.mock.calls.length)
    .toBeGreaterThan(0);

  await expect
    .element(page.getByLabelText('C++ - C++17', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByText('missing.lang (Invalid)', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Remove missing.lang' }))
    .toBeVisible();
});

test('closes the suggestion list when the input loses focus', async () => {
  await render(<Harness />);
  await expect
    .poll(() => mocks.getAvailableLanguages.mock.calls.length)
    .toBeGreaterThan(0);

  const combobox = input();
  await userEvent.click(combobox);
  await expect.element(page.getByRole('listbox')).toBeVisible();

  page.getByTestId('next-field').element().focus();
  await expect.element(combobox).toHaveAttribute('aria-expanded', 'false');
  await expect
    .poll(() => document.querySelectorAll('[role="listbox"]').length)
    .toBe(0);
});

test('reports a load failure instead of suggestions', async () => {
  mocks.getAvailableLanguages.mockReturnValue({
    send: vi.fn().mockRejectedValue(new Error('offline')),
  });
  await render(<Harness />);

  const combobox = input();
  await userEvent.click(combobox);
  const status = page.getByRole('status');
  await expect.element(status).toBeVisible();
  await expect.element(status).toHaveTextContent('Could not load suggestions');
});
