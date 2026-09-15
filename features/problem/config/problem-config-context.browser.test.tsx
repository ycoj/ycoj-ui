import BasicConfigTab from './basic-config-tab';
import {
  ProblemConfigProvider,
  useProblemConfig,
} from './problem-config-context';
import en from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

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

function output(id: string) {
  return page.getByTestId(id);
}

test('synchronizes valid YAML to the GUI and GUI changes back to YAML', async () => {
  await render(
    <ProblemConfigProvider raw={'type: default\n'} testdata={[]}>
      <StateHarness />
    </ProblemConfigProvider>
  );

  await expect.element(output('type')).toHaveTextContent('default');

  await userEvent.click(
    page.getByRole('button', { name: 'GUI change', exact: true })
  );
  await expect.element(output('type')).toHaveTextContent('interactive');
  await expect.element(output('raw')).toHaveTextContent('type: interactive');

  await userEvent.fill(
    page.getByRole('textbox', { name: 'raw' }),
    'type: communication\n'
  );
  await expect.element(output('type')).toHaveTextContent('communication');
});

test('validates GUI changes before updating validity', async () => {
  await render(
    <ProblemConfigProvider raw={'type: default\n'} testdata={[]}>
      <StateHarness />
    </ProblemConfigProvider>
  );

  await userEvent.click(
    page.getByRole('button', { name: 'Invalid GUI change' })
  );

  await expect.element(output('valid')).toHaveTextContent('false');
  await expect.element(output('error-count')).not.toHaveTextContent('0');
});

test('keeps the last valid GUI state, shows errors, and restores the working tab', async () => {
  await render(
    <ProblemConfigProvider raw={'type: default\n'} testdata={[]}>
      <StateHarness />
    </ProblemConfigProvider>
  );

  await userEvent.click(page.getByRole('button', { name: 'Subtasks tab' }));
  await userEvent.fill(page.getByRole('textbox', { name: 'raw' }), 'type: [');

  await expect.element(output('valid')).toHaveTextContent('false');
  await expect.element(output('type')).toHaveTextContent('default');
  await expect.element(output('tab')).toHaveTextContent('errors');

  await userEvent.fill(
    page.getByRole('textbox', { name: 'raw' }),
    'type: default\n'
  );
  await expect.element(output('valid')).toHaveTextContent('true');
  await expect.element(output('tab')).toHaveTextContent('subtasks');
});

test('preserves edits made while a save is pending', async () => {
  await render(
    <ProblemConfigProvider raw={'type: default\n'} testdata={[]}>
      <StateHarness />
    </ProblemConfigProvider>
  );

  await userEvent.click(page.getByRole('button', { name: 'Start save' }));
  await userEvent.fill(
    page.getByRole('textbox', { name: 'raw' }),
    'type: interactive\n'
  );
  await userEvent.click(page.getByRole('button', { name: 'Finish save' }));

  await expect.element(output('raw')).toHaveTextContent('type: interactive');
  await expect.element(output('dirty')).toHaveTextContent('true');
});

test('BasicConfigTab shows fields for the selected problem type', async () => {
  await render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ProblemConfigProvider raw={'type: default\n'} testdata={[]}>
        <BasicConfigTab languageOptions={[]} />
      </ProblemConfigProvider>
    </NextIntlClientProvider>
  );

  await expect
    .element(page.getByRole('textbox', { name: 'Filename' }))
    .toBeVisible();
  await userEvent.click(page.getByRole('radio', { name: 'Interactive' }));
  await expect
    .element(page.getByRole('combobox', { name: 'Interactor' }))
    .toBeVisible();
  await expect
    .element(page.getByRole('textbox', { name: 'Filename' }))
    .not.toBeInTheDocument();
  await userEvent.click(page.getByRole('radio', { name: 'Communication' }));
  await expect
    .element(page.getByRole('spinbutton', { name: 'Processes' }))
    .toBeVisible();
});

test('BasicConfigTab associates the preset checker label with its select', async () => {
  await render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ProblemConfigProvider raw={'type: default\n'} testdata={[]}>
        <BasicConfigTab languageOptions={[]} />
      </ProblemConfigProvider>
    </NextIntlClientProvider>
  );

  await userEvent.click(page.getByRole('radio', { name: 'Testlib' }));
  await userEvent.click(page.getByRole('radio', { name: 'Preset' }));

  await expect
    .element(page.getByRole('combobox', { name: 'Preset checker' }))
    .toBeVisible();
});
