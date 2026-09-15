import PasteSelect from './paste-select';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const options = { cpp: 'C++', '': 'Plain text' };

test('shows a saved empty language as plain text instead of C++', async () => {
  await render(
    <PasteSelect
      id="language"
      label="Language"
      value=""
      options={options}
      onChange={vi.fn()}
      disabled={false}
    />
  );

  const trigger = page.getByRole('combobox', { name: 'Language' });
  await expect.element(trigger).toBeVisible();
  await expect.element(trigger).toHaveTextContent('Plain text');
});

test('returns an empty language when the user chooses plain text', async () => {
  const onChange = vi.fn();
  await render(
    <PasteSelect
      id="language"
      label="Language"
      value="cpp"
      options={options}
      onChange={onChange}
      disabled={false}
    />
  );

  await userEvent.click(page.getByRole('combobox', { name: 'Language' }));
  const plainText = page.getByRole('option', { name: 'Plain text' });
  await expect.element(plainText).toBeVisible();
  await userEvent.click(plainText);

  expect(onChange).toHaveBeenCalledWith('');
});

test('selects a concrete language for an empty saved value', async () => {
  const onChange = vi.fn();
  await render(
    <PasteSelect
      id="language"
      label="Language"
      value=""
      options={options}
      onChange={onChange}
      disabled={false}
    />
  );

  await userEvent.click(page.getByRole('combobox', { name: 'Language' }));
  await userEvent.click(page.getByRole('option', { name: 'C++' }));

  expect(onChange).toHaveBeenCalledWith('cpp');
});

test('marks the trigger invalid and surfaces the error message', async () => {
  await render(
    <PasteSelect
      id="language"
      label="Language"
      value=""
      options={options}
      onChange={vi.fn()}
      disabled={false}
      error="Pick a language"
    />
  );

  const trigger = page.getByRole('combobox', { name: 'Language' });
  await expect.element(trigger).toHaveAttribute('aria-invalid', 'true');
  await expect
    .element(page.getByText('Pick a language', { exact: true }))
    .toBeVisible();
  const invalidBorder = getComputedStyle(trigger.element()).borderColor;
  expect(invalidBorder).not.toBe('rgba(0, 0, 0, 0)');
});
