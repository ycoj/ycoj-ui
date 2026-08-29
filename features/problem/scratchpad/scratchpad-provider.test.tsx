import ScratchpadProvider, { useScratchpad } from './scratchpad-provider';
import type { ScratchpadConfig } from './scratchpad-types';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

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

describe('ScratchpadProvider', () => {
  it('opens, closes, and restores focus to the launcher', async () => {
    const user = userEvent.setup();
    renderProvider();
    const launcher = screen.getByRole('button', { name: 'Open workspace' });

    await user.click(launcher);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close workspace' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(launcher).toHaveFocus();
  });

  it('opens with the legacy Alt+E shortcut', () => {
    renderProvider();
    fireEvent.keyDown(document, { key: 'e', altKey: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
