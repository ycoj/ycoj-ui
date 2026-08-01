import { cn } from './utils';
import { bench, describe } from 'vitest';

// `cn` runs on nearly every component render, so both the trivial and the
// conflict-heavy cases are worth tracking.
const base =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors';
const variant =
  'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2';
const overrides =
  'px-6 py-3 text-base bg-destructive text-destructive-foreground';

// Keeps results reachable so the engine cannot drop the calls entirely.
const sink: { value: unknown } = { value: undefined };

describe('cn', () => {
  bench('cn - simple class list', () => {
    sink.value = cn(base, 'w-full');
  });

  bench('cn - conditional class list', () => {
    sink.value = cn(
      base,
      { [variant]: true, 'pointer-events-none opacity-50': false },
      ['shadow-xs', undefined, null],
      'rounded-lg'
    );
  });

  bench('cn - conflicting tailwind utilities', () => {
    sink.value = cn(base, variant, overrides, 'rounded-full', 'px-2');
  });

  bench('cn - many merges with dynamic classes', () => {
    let length = 0;
    for (let index = 0; index < 200; index += 1) {
      length += cn(
        base,
        variant,
        `w-[${index}px]`,
        index % 2 === 0 && overrides
      ).length;
    }
    sink.value = length;
  });
});
