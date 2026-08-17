import AsyncAutoComplete from './async-auto-complete';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
};

function Harness({
  searchItems,
  resolveItem,
  allowEmptyQuery,
  initialValue = '',
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
      />
      <output data-testid="value">{value}</output>
    </>
  );
}

async function advanceDebounce() {
  await act(async () => {
    vi.advanceTimersByTime(300);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('AsyncAutoComplete', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('keeps free input, debounces search, and selects and clears an item', async () => {
    const searchItems = vi
      .fn<(query: string) => Promise<Item[]>>()
      .mockResolvedValue([{ id: '1', label: 'Alice' }]);
    render(<Harness searchItems={searchItems} />);

    const input = screen.getByRole('combobox', { name: 'Search items' });
    fireEvent.change(input, { target: { value: 'ali' } });

    expect(screen.getByTestId('value')).toHaveTextContent('ali');
    expect(searchItems).not.toHaveBeenCalled();

    await advanceDebounce();

    expect(searchItems).toHaveBeenCalledWith('ali');
    fireEvent.click(screen.getByText('Alice'));
    expect(screen.getByTestId('value')).toHaveTextContent('1');
    expect(input).toHaveValue('Alice');

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.getByTestId('value')).toBeEmptyDOMElement();
    expect(input).toHaveValue('');
  });

  it('resolves an existing value to its selected item label', async () => {
    const searchItems = vi
      .fn<(query: string) => Promise<Item[]>>()
      .mockResolvedValue([]);
    const resolveItem = vi
      .fn<(value: string) => Promise<Item | null>>()
      .mockResolvedValue({ id: '1', label: 'Alice' });

    render(
      <Harness
        searchItems={searchItems}
        resolveItem={resolveItem}
        initialValue="1"
      />
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(resolveItem).toHaveBeenCalledWith('1');
    expect(screen.getByRole('combobox', { name: 'Search items' })).toHaveValue(
      'Alice'
    );
    expect(screen.getByTestId('value')).toHaveTextContent('1');
  });

  it('uses the edit label when opening an existing selection', async () => {
    const searchItems = vi
      .fn<(query: string) => Promise<Item[]>>()
      .mockResolvedValue([]);
    const resolveItem = vi
      .fn<(value: string) => Promise<Item | null>>()
      .mockResolvedValue({ id: '1', label: 'Alice' });

    render(
      <Harness
        searchItems={searchItems}
        resolveItem={resolveItem}
        initialValue="1"
      />
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const input = screen.getByRole('combobox', { name: 'Search items' });
    expect(input).toHaveValue('Alice');
    fireEvent.mouseDown(input);

    expect(input).toHaveValue('Alice');
  });

  it('supports keyboard selection', async () => {
    const searchItems = vi
      .fn<(query: string) => Promise<Item[]>>()
      .mockResolvedValue([{ id: '1', label: 'Alice' }]);
    render(<Harness searchItems={searchItems} />);

    const input = screen.getByRole('combobox', { name: 'Search items' });
    fireEvent.change(input, { target: { value: 'ali' } });
    await advanceDebounce();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByTestId('value')).toHaveTextContent('1');
    expect(input).toHaveValue('Alice');
  });

  it('ignores an older response that resolves after a newer query', async () => {
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
    render(<Harness searchItems={searchItems} />);

    const input = screen.getByRole('combobox', { name: 'Search items' });
    fireEvent.change(input, { target: { value: 'a' } });
    await advanceDebounce();
    fireEvent.change(input, { target: { value: 'ab' } });
    await advanceDebounce();

    await act(async () => resolveSecond([{ id: '2', label: 'Abel' }]));
    expect(screen.getByText('Abel')).toBeInTheDocument();

    await act(async () => resolveFirst([{ id: '1', label: 'Alice' }]));
    expect(screen.getByText('Abel')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).toBeNull();
  });

  it('only searches an empty query when enabled and reports failures', async () => {
    const disabledSearch = vi.fn<(query: string) => Promise<Item[]>>();
    const { unmount } = render(<Harness searchItems={disabledSearch} />);

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Search items' }));
    await advanceDebounce();
    expect(disabledSearch).not.toHaveBeenCalled();
    unmount();

    const enabledSearch = vi
      .fn<(query: string) => Promise<Item[]>>()
      .mockRejectedValue(new Error('network failure'));
    render(
      <Harness searchItems={enabledSearch} allowEmptyQuery initialValue="" />
    );

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Search items' }));
    await advanceDebounce();

    expect(enabledSearch).toHaveBeenCalledWith('');
    expect(screen.getByText('Could not load suggestions')).toBeInTheDocument();
  });
});
