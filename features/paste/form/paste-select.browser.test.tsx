import PasteSelect from './paste-select';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => vi.restoreAllMocks());

describe('paste language selection', () => {
  it('displays a saved empty language instead of selecting C++', () => {
    render(
      <PasteSelect
        id="language"
        label="Language"
        value=""
        options={{ cpp: 'C++', '': 'Plain text' }}
        onChange={vi.fn()}
        disabled={false}
      />
    );
    expect(
      screen.getByRole('combobox', { name: 'Language' })
    ).toHaveTextContent('Plain text');
  });

  it('returns an empty language when choosing plain text', async () => {
    const onChange = vi.fn();
    const scroll = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollIntoView'
    );
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
    try {
      render(
        <PasteSelect
          id="language"
          label="Language"
          value="cpp"
          options={{ cpp: 'C++', '': 'Plain text' }}
          onChange={onChange}
          disabled={false}
        />
      );
      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
      fireEvent.click(
        await screen.findByRole('option', { name: 'Plain text' })
      );
      expect(onChange).toHaveBeenCalledWith('');
    } finally {
      if (scroll)
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', scroll);
      else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
    }
  });
});
