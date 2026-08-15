'use client';

import {
  detectTestcasePairs,
  dumpProblemConfig,
  moveTestcases,
  naturalSort,
  normalizeSubtaskScores,
  parseProblemConfigYaml,
  removeDeletedReferences,
  renameConfigReferences,
  testcaseKey,
} from './problem-config-utils';
import type { FileInfo } from '@/shared/types/file';
import type {
  ProblemConfigFile,
  ProblemConfigValidationError,
  ProblemTestCase,
} from '@/shared/types/problem-config';
import {
  createContext,
  type Dispatch,
  type ReactNode,
  useContext,
  useMemo,
  useReducer,
} from 'react';

export type ConfigTab = 'basic' | 'subtasks' | 'errors';

export type ProblemConfigState = {
  config: ProblemConfigFile;
  raw: string;
  savedRaw: string;
  valid: boolean;
  errors: ProblemConfigValidationError[];
  testdata: FileInfo[];
  unassigned: ProblemTestCase[];
  selection: Record<string, string[]>;
  tab: ConfigTab;
  workingTab: Exclude<ConfigTab, 'errors'>;
  dirty: boolean;
  saving: boolean;
  mutatingFiles: boolean;
};

type Action =
  | { type: 'rawChanged'; raw: string }
  | { type: 'configChanged'; config: ProblemConfigFile }
  | { type: 'tabChanged'; tab: ConfigTab }
  | { type: 'selectionChanged'; source: number | null; keys: string[] }
  | {
      type: 'moveCases';
      source: number | null;
      target: number | null;
      keys: string[];
    }
  | { type: 'addUnassigned'; cases: ProblemTestCase[] }
  | { type: 'removeUnassigned'; keys: string[] }
  | { type: 'autoConfigure' }
  | { type: 'saveStarted' }
  | { type: 'saveSucceeded'; raw: string; testdata: FileInfo[] }
  | { type: 'saveFailed' }
  | { type: 'fileMutationStarted' }
  | { type: 'testdataRefreshed'; testdata: FileInfo[] }
  | { type: 'fileRenamed'; oldName: string; newName: string }
  | { type: 'filesDeleted'; names: string[] }
  | { type: 'fileMutationFinished' };

const ProblemConfigContext = createContext<
  { state: ProblemConfigState; dispatch: Dispatch<Action> } | undefined
>(undefined);

const sourceKey = (source: number | null) =>
  source === null ? 'unassigned' : String(source);

function assignedKeys(config: ProblemConfigFile) {
  return new Set(
    (config.subtasks ?? []).flatMap((subtask) =>
      (subtask.cases ?? []).map(testcaseKey)
    )
  );
}

function detectedUnassigned(config: ProblemConfigFile, testdata: FileInfo[]) {
  const assigned = assignedKeys(config);
  return naturalSort(
    detectTestcasePairs(
      testdata.map((file) => file.name),
      {}
    )
      .flatMap((subtask) => subtask.cases ?? [])
      .filter((testcase) => !assigned.has(testcaseKey(testcase))),
    (testcase) => testcase.input
  );
}

function initialState(raw: string, testdata: FileInfo[]): ProblemConfigState {
  const parsed = parseProblemConfigYaml(raw);
  const config = parsed.config ?? { type: 'default', subtasks: [] };
  const initialRaw = raw.trim() ? raw : dumpProblemConfig(config);
  return {
    config,
    raw: initialRaw,
    savedRaw: initialRaw,
    valid: Boolean(parsed.config),
    errors: parsed.errors,
    testdata,
    unassigned: detectedUnassigned(config, testdata),
    selection: {},
    tab: parsed.config ? 'basic' : 'errors',
    workingTab: 'basic',
    dirty: false,
    saving: false,
    mutatingFiles: false,
  };
}

function reducer(
  state: ProblemConfigState,
  action: Action
): ProblemConfigState {
  switch (action.type) {
    case 'rawChanged': {
      const parsed = parseProblemConfigYaml(action.raw);
      if (!parsed.config) {
        return {
          ...state,
          raw: action.raw,
          valid: false,
          errors: parsed.errors,
          tab: 'errors',
          dirty: action.raw !== state.savedRaw,
        };
      }
      return {
        ...state,
        config: parsed.config,
        raw: action.raw,
        valid: true,
        errors: [],
        tab: state.tab === 'errors' ? state.workingTab : state.tab,
        unassigned: detectedUnassigned(parsed.config, state.testdata),
        dirty: action.raw !== state.savedRaw,
      };
    }
    case 'configChanged': {
      const raw = dumpProblemConfig(action.config);
      return {
        ...state,
        config: action.config,
        raw,
        valid: true,
        errors: [],
        dirty: raw !== state.savedRaw,
      };
    }
    case 'tabChanged':
      if (action.tab === 'errors') return { ...state, tab: action.tab };
      return { ...state, tab: action.tab, workingTab: action.tab };
    case 'selectionChanged':
      return {
        ...state,
        selection: {
          ...state.selection,
          [sourceKey(action.source)]: action.keys,
        },
      };
    case 'moveCases': {
      const moved = moveTestcases(
        state.config,
        state.unassigned,
        action.source,
        action.target,
        action.keys
      );
      const raw = dumpProblemConfig(moved.config);
      return {
        ...state,
        ...moved,
        raw,
        selection: {},
        dirty: raw !== state.savedRaw,
      };
    }
    case 'addUnassigned': {
      const existing = new Set(state.unassigned.map(testcaseKey));
      return {
        ...state,
        unassigned: naturalSort(
          [
            ...state.unassigned,
            ...action.cases.filter(
              (testcase) => !existing.has(testcaseKey(testcase))
            ),
          ],
          (testcase) => testcase.input
        ),
      };
    }
    case 'removeUnassigned': {
      const removed = new Set(action.keys);
      return {
        ...state,
        unassigned: state.unassigned.filter(
          (testcase) => !removed.has(testcaseKey(testcase))
        ),
        selection: {},
      };
    }
    case 'autoConfigure': {
      const subtasks = normalizeSubtaskScores(
        detectTestcasePairs(
          state.testdata.map((file) => file.name),
          state.config
        )
      );
      const config = { ...state.config, subtasks };
      const raw = dumpProblemConfig(config);
      return {
        ...state,
        config,
        raw,
        unassigned: detectedUnassigned(config, state.testdata),
        selection: {},
        dirty: raw !== state.savedRaw,
      };
    }
    case 'saveStarted':
      return { ...state, saving: true };
    case 'saveSucceeded':
      return {
        ...state,
        raw: action.raw,
        savedRaw: action.raw,
        testdata: action.testdata,
        dirty: false,
        saving: false,
      };
    case 'saveFailed':
      return { ...state, saving: false };
    case 'fileMutationStarted':
      return { ...state, mutatingFiles: true };
    case 'testdataRefreshed':
      return {
        ...state,
        testdata: action.testdata,
        unassigned: detectedUnassigned(state.config, action.testdata),
      };
    case 'fileRenamed': {
      const config = renameConfigReferences(
        state.config,
        action.oldName,
        action.newName
      );
      const unassigned = state.unassigned.map((testcase) => ({
        ...testcase,
        input:
          testcase.input === action.oldName ? action.newName : testcase.input,
        output:
          testcase.output === action.oldName ? action.newName : testcase.output,
      }));
      const raw = dumpProblemConfig(config);
      return {
        ...state,
        config,
        raw,
        unassigned,
        dirty: raw !== state.savedRaw,
      };
    }
    case 'filesDeleted': {
      const reconciled = removeDeletedReferences(
        state.config,
        state.unassigned,
        action.names
      );
      const raw = dumpProblemConfig(reconciled.config);
      return {
        ...state,
        ...reconciled,
        raw,
        selection: {},
        dirty: raw !== state.savedRaw,
      };
    }
    case 'fileMutationFinished':
      return { ...state, mutatingFiles: false };
  }
}

export function ProblemConfigProvider({
  raw,
  testdata,
  children,
}: {
  raw: string;
  testdata: FileInfo[];
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    initialState(raw, testdata)
  );
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return (
    <ProblemConfigContext.Provider value={value}>
      {children}
    </ProblemConfigContext.Provider>
  );
}

export function useProblemConfig() {
  const context = useContext(ProblemConfigContext);
  if (!context)
    throw new Error(
      'useProblemConfig must be used inside ProblemConfigProvider'
    );
  return context;
}
