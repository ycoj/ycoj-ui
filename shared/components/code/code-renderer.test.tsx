import CodeRenderer from './code-renderer';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/lib/code-highlighter', () => ({
  highlightCodeToHtml: (code: string) => code,
}));

describe('CodeRenderer', () => {
  it('renders highlighted code in a pre element', () => {
    const { container } = render(
      <CodeRenderer code="int main() {}" language="cpp" />
    );

    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    expect(pre).toHaveTextContent('int main() {}');
  });
});
