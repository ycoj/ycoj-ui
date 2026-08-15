import BasicConfigTab from './basic-config-tab';
import {
  ProblemConfigProvider,
  useProblemConfig,
} from './problem-config-context';
import en from '@/messages/en.json';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

function StateHarness() {
  const { state, dispatch } = useProblemConfig();
  return (
    <div>
      <output data-testid="type">{state.config.type}</output>
      <output data-testid="tab">{state.tab}</output>
      <output data-testid="valid">{String(state.valid)}</output>
      <output data-testid="error-count">{state.errors.length}</output>
      <output data-testid="raw">{state.raw}</output>
      <output data-testid="dirty">{String(state.dirty)}</output>
      <button
        type="button"
        onClick={() => dispatch({ type: 'tabChanged', tab: 'subtasks' })}
      >
        Subtasks tab
      </button>
      <button type="button" onClick={() => dispatch({ type: 'saveStarted' })}>
        Start save
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: 'saveSucceeded',
            savedRaw: 'type: default\n',
            sourceRaw: 'type: default\n',
          })
        }
      >
        Finish save
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: 'configChanged',
            config: { ...state.config, type: 'interactive' },
          })
        }
      >
        GUI change
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: 'configChanged',
            config: { ...state.config, num_processes: 0 },
          })
        }
      >
        Invalid GUI change
      </button>
      <textarea
        aria-label="raw"
        value={state.raw}
        onChange={(event) =>
          dispatch({ type: 'rawChanged', raw: event.target.value })
        }
      />
    </div>
  );
}

describe('ProblemConfigProvider synchronization', () => {
  it('synchronizes valid YAML to the GUI and GUI changes back to YAML', async () => {
    const user = userEvent.setup();
    render(
      <ProblemConfigProvider raw="type: default\n" testdata={[]}>
        <StateHarness />
      </ProblemConfigProvider>
    );
    expect(screen.getByTestId('type')).toHaveTextContent('default');
    await user.click(screen.getByRole('button', { name: 'GUI change' }));
    expect(screen.getByTestId('type')).toHaveTextContent('interactive');
    expect(screen.getByTestId('raw')).toHaveTextContent('type: interactive');

    fireEvent.change(screen.getByRole('textbox', { name: 'raw' }), {
      target: { value: 'type: communication\n' },
    });
    expect(screen.getByTestId('type')).toHaveTextContent('communication');
  });

  it('validates GUI changes before updating validity', async () => {
    const user = userEvent.setup();
    render(
      <ProblemConfigProvider raw="type: default\n" testdata={[]}>
        <StateHarness />
      </ProblemConfigProvider>
    );

    await user.click(
      screen.getByRole('button', { name: 'Invalid GUI change' })
    );

    expect(screen.getByTestId('valid')).toHaveTextContent('false');
    expect(screen.getByTestId('error-count')).not.toHaveTextContent('0');
  });

  it('keeps the last valid GUI state, shows errors, and restores the working tab', async () => {
    const user = userEvent.setup();
    render(
      <ProblemConfigProvider raw="type: default\n" testdata={[]}>
        <StateHarness />
      </ProblemConfigProvider>
    );
    await user.click(screen.getByRole('button', { name: 'Subtasks tab' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'raw' }), {
      target: { value: 'type: [' },
    });
    expect(screen.getByTestId('valid')).toHaveTextContent('false');
    expect(screen.getByTestId('type')).toHaveTextContent('default');
    expect(screen.getByTestId('tab')).toHaveTextContent('errors');

    fireEvent.change(screen.getByRole('textbox', { name: 'raw' }), {
      target: { value: 'type: default\n' },
    });
    expect(screen.getByTestId('valid')).toHaveTextContent('true');
    expect(screen.getByTestId('tab')).toHaveTextContent('subtasks');
  });

  it('preserves edits made while a save is pending', async () => {
    const user = userEvent.setup();
    render(
      <ProblemConfigProvider raw="type: default\n" testdata={[]}>
        <StateHarness />
      </ProblemConfigProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Start save' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'raw' }), {
      target: { value: 'type: interactive\n' },
    });
    await user.click(screen.getByRole('button', { name: 'Finish save' }));

    expect(screen.getByTestId('raw')).toHaveTextContent('type: interactive');
    expect(screen.getByTestId('dirty')).toHaveTextContent('true');
  });
});

describe('BasicConfigTab', () => {
  it('shows fields for the selected problem type', async () => {
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <ProblemConfigProvider raw="type: default\n" testdata={[]}>
          <BasicConfigTab languageOptions={[]} />
        </ProblemConfigProvider>
      </NextIntlClientProvider>
    );
    expect(
      screen.getByRole('textbox', { name: 'Filename' })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Interactive' }));
    expect(
      screen.getByRole('combobox', { name: 'Interactor' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Filename' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Communication' }));
    expect(
      screen.getByRole('spinbutton', { name: 'Processes' })
    ).toBeInTheDocument();
  });

  it('associates the preset checker label with its select', async () => {
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <ProblemConfigProvider raw="type: default\n" testdata={[]}>
          <BasicConfigTab languageOptions={[]} />
        </ProblemConfigProvider>
      </NextIntlClientProvider>
    );

    await user.click(screen.getByRole('radio', { name: 'Testlib' }));
    await user.click(screen.getByRole('radio', { name: 'Preset' }));

    expect(
      screen.getByRole('combobox', { name: 'Preset checker' })
    ).toBeInTheDocument();
  });
});
