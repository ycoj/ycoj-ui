import CodeRenderer from './code-renderer';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

test('renders highlighted code in a pre element', async () => {
  await render(<CodeRenderer code="int main() {}" language="cpp" />);

  const pre = document.querySelector('pre')!;
  expect(pre).not.toBeNull();
  expect(pre.textContent).toBe('int main() {}');
  expect(getComputedStyle(pre).whiteSpace).toBe('pre');

  const spans = Array.from(pre.querySelectorAll('span'));
  expect(spans.length).toBeGreaterThan(0);
  const colors = new Set(spans.map((span) => getComputedStyle(span).color));
  expect(colors.size).toBeGreaterThanOrEqual(2);
});

test('renders an explicit plaintext fallback without highlighting', async () => {
  await render(
    <CodeRenderer
      code="<plain>"
      language="unknown-language"
      fallback="plaintext"
    />
  );

  const pre = document.querySelector('pre')!;
  expect(pre.textContent).toBe('<plain>');
  expect(pre.querySelector('span')).toBeNull();
});

test('keeps the raw code as text when markup is present', async () => {
  await render(
    <CodeRenderer
      code={'<img src=x onerror="alert(1)">'}
      language="unknown-language"
      fallback="plaintext"
    />
  );

  const pre = document.querySelector('pre')!;
  expect(pre.textContent).toBe('<img src=x onerror="alert(1)">');
  expect(pre.querySelector('img')).toBeNull();
});
