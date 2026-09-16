import CodeRenderer from './code-renderer';
import { highlightCodeToHtml } from '@/shared/lib/code-highlighter';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/lib/code-highlighter', () => ({
  highlightCodeToHtml: vi.fn((code: string) => code),
}));

describe('CodeRenderer', () => {
  it('renders highlighted code in a pre element', () => {
    const { container } = render(
      <CodeRenderer code="int main() {}" language="cpp" />
    );

    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    expect(pre).toHaveTextContent('int main() {}');
    expect(highlightCodeToHtml).toHaveBeenCalledWith(
      'int main() {}',
      'cpp',
      'cpp'
    );
  });

  it('forwards an explicit plaintext fallback', () => {
    render(
      <CodeRenderer
        code="<plain>"
        language="unknown-language"
        fallback="plaintext"
      />
    );

    expect(highlightCodeToHtml).toHaveBeenCalledWith(
      '<plain>',
      'unknown-language',
      'plaintext'
    );
  });
});
