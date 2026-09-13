import CcfHook from './ccf-hook';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('CcfHook', () => {
  it.each([
    [3, 'green'],
    [6, 'blue'],
    [9, 'gold'],
  ])('renders the %s-level hook with the %s asset', (level, color) => {
    render(<CcfHook level={level} />);

    expect(screen.getByRole('img', { name: `CCF ${level}` })).toHaveAttribute(
      'src',
      expect.stringContaining(`ccf-hook-${color}.png`)
    );
  });

  it.each([undefined, 0, 2])('hides levels below 3 (%s)', (level) => {
    const { container } = render(<CcfHook level={level} />);
    expect(container).toBeEmptyDOMElement();
  });
});
