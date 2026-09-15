import ScratchpadProvider, { useScratchpad } from './scratchpad-provider';
import type { ScratchpadConfig } from './scratchpad-types';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

vi.mock('./scratchpad-workspace', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog">
      <button onClick={onClose}>Close workspace</button>
    </div>
  ),
}));

const config: ScratchpadConfig = {
  pid: 'P1',
  problemDocId: 1,
  domainId: 'system',
  problemType: 'default',
  title: 'Problem',
  eventKind: 'standalone',
  userId: 2,
  languages: {
    cc: {
      display: 'C++',
      versions: [{ name: 'cc.cc17o2', display: 'C++ 17' }],
    },
  },
};

function Launcher() {
  const { open } = useScratchpad();
  return <button onClick={open}>Open workspace</button>;
}

function renderProvider() {
  return render(
    <ScratchpadProvider config={config} statement={<p>Statement</p>}>
      <Launcher />
    </ScratchpadProvider>
  );
}

test('opens, closes, and restores focus to the launcher', async () => {
  await renderProvider();
  const launcher = page.getByRole('button', { name: 'Open workspace' });

  await userEvent.click(launcher);
  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();

  await userEvent.click(page.getByRole('button', { name: 'Close workspace' }));
  await expect.element(dialog).not.toBeInTheDocument();
  await expect
    .poll(() => document.activeElement === launcher.element())
    .toBe(true);
});

test('opens with the legacy Alt+E shortcut', async () => {
  await renderProvider();

  await userEvent.keyboard('{Alt>}e{/Alt}');
  await expect.element(page.getByRole('dialog')).toBeVisible();
});
