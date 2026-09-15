import AsyncAutoComplete from './async-auto-complete';
import { useState } from 'react';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

type Item = {
  id: string;
  label: string;
};

const messages = {
  clear: 'Clear selection',
  loadFailed: 'Could not load suggestions',
  loading: 'Searching...',
  noResults: 'No matches found',
};

const itemKey = (item: Item) => item.id;
const itemLabel = (item: Item) => item.label;

type HarnessProps = {
  searchItems: (query: string) => Promise<Item[]>;
  resolveItem?: (value: string) => Promise<Item | null>;
  allowEmptyQuery?: boolean;
  initialValue?: string;
  onItemSelect?: (item: Item) => void;
};

function Harness({
  searchItems,
  resolveItem,
  allowEmptyQuery,
  initialValue = '',
  onItemSelect,
}: HarnessProps) {
  const [value, setValue] = useState(initialValue);

  return (
    <>
      <AsyncAutoComplete
        value={value}
        onValueChange={setValue}
        searchItems={searchItems}
        resolveItem={resolveItem}
        itemKey={itemKey}
        itemLabel={itemLabel}
        itemInputLabel={itemLabel}
        renderItem={(item) => <span>{item.label}</span>}
        messages={messages}
        allowEmptyQuery={allowEmptyQuery}
        placeholder="Search items"
        onItemSelect={onItemSelect}
      />
      <output data-testid="value">{value}</output>
    </>
  );
}

function input() {
  return page.getByRole('combobox', { name: 'Search items' });
}

function valueOutput() {
  return page.getByTestId('value');
}

test('keeps free input, debounces search, and selects and clears an item', async () => {
  const searchItems = vi
    .fn<(query: string) => Promise<Item[]>>()
    .mockResolvedValue([{ id: '1', label: 'Alice' }]);
  await render(<Harness searchItems={searchItems} />);

  const combobox = input();
  await userEvent.type(combobox, 'ali');

  await expect.element(valueOutput()).toHaveTextContent('ali');
  expect(searchItems).not.toHaveBeenCalled();

  await expect.poll(() => searchItems.mock.calls.length).toBe(1);
  expect(searchItems).toHaveBeenCalledWith('ali');

  await userEvent.click(page.getByRole('option', { name: /Alice/ }));
  await expect.element(valueOutput()).toHaveTextContent('1');
  await expect.element(combobox).toHaveValue('Alice');

  await userEvent.click(page.getByRole('button', { name: 'Clear selection' }));
  await expect.element(valueOutput()).toBeEmptyDOMElement();
  await expect.element(combobox).toHaveValue('');
});

test('resolves an existing value to its selected item label', async () => {
  const resolveItem = vi
    .fn<(value: string) => Promise<Item | null>>()
    .mockResolvedValue({ id: '1', label: 'Alice' });
  await render(
    <Harness
      searchItems={vi.fn().mockResolvedValue([])}
      resolveItem={resolveItem}
      initialValue="1"
    />
  );

  await expect.poll(() => resolveItem.mock.calls.length).toBeGreaterThan(0);
  expect(resolveItem).toHaveBeenCalledWith('1');
  await expect.element(input()).toHaveValue('Alice');
  await expect.element(valueOutput()).toHaveTextContent('1');
});

test('uses the edit label when opening an existing selection', async () => {
  const resolveItem = vi
    .fn<(value: string) => Promise<Item | null>>()
    .mockResolvedValue({ id: '1', label: 'Alice' });
  await render(
    <Harness
      searchItems={vi.fn().mockResolvedValue([])}
      resolveItem={resolveItem}
      initialValue="1"
    />
  );

  const combobox = input();
  await expect.element(combobox).toHaveValue('Alice');

  await userEvent.click(combobox);
  await expect.element(combobox).toHaveValue('Alice');
});

test('supports keyboard selection', async () => {
  const searchItems = vi
    .fn<(query: string) => Promise<Item[]>>()
    .mockResolvedValue([{ id: '1', label: 'Alice' }]);
  await render(<Harness searchItems={searchItems} />);

  const combobox = input();
  await userEvent.type(combobox, 'ali');
  await expect
    .element(page.getByRole('option', { name: /Alice/ }))
    .toBeVisible();

  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard('{Enter}');

  await expect.element(valueOutput()).toHaveTextContent('1');
  await expect.element(combobox).toHaveValue('Alice');
});

test('clears the input after onItemSelect instead of keeping the selected value', async () => {
  const onItemSelect = vi.fn();
  await render(
    <Harness
      searchItems={vi.fn().mockResolvedValue([{ id: '1', label: 'Alice' }])}
      onItemSelect={onItemSelect}
    />
  );

  const combobox = input();
  await userEvent.type(combobox, 'ali');
  await expect
    .element(page.getByRole('option', { name: /Alice/ }))
    .toBeVisible();
  await userEvent.click(page.getByRole('option', { name: /Alice/ }));

  expect(onItemSelect).toHaveBeenCalledWith({ id: '1', label: 'Alice' });
  await expect.element(valueOutput()).toBeEmptyDOMElement();
  await expect.element(combobox).toHaveValue('');
});

test('ignores an older response that resolves after a newer query', async () => {
  let resolveFirst!: (items: Item[]) => void;
  let resolveSecond!: (items: Item[]) => void;
  const searchItems = vi
    .fn<(query: string) => Promise<Item[]>>()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        })
    )
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSecond = resolve;
        })
    );
  await render(<Harness searchItems={searchItems} />);

  const combobox = input();
  await userEvent.type(combobox, 'al');
  await expect
    .poll(() => searchItems.mock.calls.length, { timeout: 5000 })
    .toBe(1);
  await userEvent.type(combobox, 'i');
  await expect.poll(() => searchItems.mock.calls.length).toBe(2);

  resolveSecond([{ id: '2', label: 'Abel' }]);
  await expect
    .element(page.getByRole('option', { name: /Abel/ }))
    .toBeVisible();

  resolveFirst([{ id: '1', label: 'Alice' }]);
  await expect
    .element(page.getByRole('option', { name: /Alice/ }))
    .not.toBeInTheDocument();
  await expect
    .element(page.getByRole('option', { name: /Abel/ }))
    .toBeVisible();
});

test('only searches an empty query when enabled and reports failures', async () => {
  const disabledSearch = vi.fn<(query: string) => Promise<Item[]>>();
  const first = await render(<Harness searchItems={disabledSearch} />);

  await userEvent.click(input());
  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(disabledSearch).not.toHaveBeenCalled();
  await first.unmount();

  const enabledSearch = vi
    .fn<(query: string) => Promise<Item[]>>()
    .mockRejectedValue(new Error('network failure'));
  await render(
    <Harness searchItems={enabledSearch} allowEmptyQuery initialValue="" />
  );

  await userEvent.click(input());
  await expect.poll(() => enabledSearch.mock.calls.length).toBe(1);
  expect(enabledSearch).toHaveBeenCalledWith('');
  await expect
    .element(page.getByText('Could not load suggestions', { exact: true }))
    .toBeVisible();
});
