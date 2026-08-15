'use client';

import BasicConfigTab from './basic-config-tab';
import ConfigYamlEditor from './config-yaml-editor';
import {
  ProblemConfigProvider,
  useProblemConfig,
} from './problem-config-context';
import { selectSaveYaml } from './problem-config-utils';
import SubtasksConfigTab from './subtasks-config-tab';
import TestdataSidebar from './testdata-sidebar';
import ClientApis from '@/api/client/method';
import { Button } from '@/shared/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import type { FileInfo } from '@/shared/types/file';
import {
  ArrowLeft,
  AlertTriangle,
  ListTree,
  Save,
  Settings2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { AlertDialog } from 'radix-ui';
import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  pid: string;
  docId: number;
  title: string;
  config: string;
  testdata: FileInfo[];
  languageOptions: Array<{ value: string; label: string }>;
};

function ConfigFormPane({
  languageOptions,
}: {
  languageOptions: Props['languageOptions'];
}) {
  const t = useTranslations('problem.config');
  const { state, dispatch } = useProblemConfig();
  return (
    <div className="h-full max-h-[60vh] overflow-auto bg-background">
      <Tabs
        className="min-h-full gap-0"
        value={state.valid ? state.tab : 'errors'}
        onValueChange={(tab) =>
          dispatch({
            type: 'tabChanged',
            tab: tab as 'basic' | 'subtasks' | 'errors',
          })
        }
      >
        <div className="sticky top-0 z-10 bg-background px-4 sm:px-6">
          <TabsList
            variant="line"
            className="h-11 max-w-full"
            aria-label={t('formTabs')}
          >
            <TabsTrigger value="basic" disabled={!state.valid}>
              <Settings2 />
              {t('basic')}
            </TabsTrigger>
            <TabsTrigger value="subtasks" disabled={!state.valid}>
              <ListTree />
              {t('subtasks')}
            </TabsTrigger>
            <TabsTrigger value="errors" disabled={state.valid}>
              <AlertTriangle />
              {state.errors.length
                ? t('errorsCount', { count: state.errors.length })
                : t('errors')}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="basic"
          className="mx-auto w-full max-w-4xl p-4 sm:p-6"
        >
          <BasicConfigTab languageOptions={languageOptions} />
        </TabsContent>
        <TabsContent value="subtasks" className="p-4 sm:p-6">
          <SubtasksConfigTab />
        </TabsContent>
        <TabsContent value="errors" className="p-4 sm:p-6">
          <div
            className="mx-auto max-w-3xl space-y-3"
            role="alert"
            data-llm-visible="true"
          >
            <h3
              className="font-semibold"
              data-llm-text={t('configurationErrors')}
            >
              {t('configurationErrors')}
            </h3>
            <ul className="space-y-2">
              {state.errors.map((error, index) => (
                <li
                  key={`${error.path}-${error.message}-${index}`}
                  className="rounded-md bg-destructive/5 px-3 py-2 text-sm"
                >
                  <code className="font-mono text-xs text-destructive">
                    {error.path}
                  </code>
                  <p data-llm-text={error.message}>{error.message}</p>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Workspace({
  pid,
  docId,
  title,
  languageOptions,
}: Omit<Props, 'config' | 'testdata'>) {
  const t = useTranslations('problem.config');
  const problemT = useTranslations('problem');
  const { state, dispatch } = useProblemConfig();
  const [confirmInvalid, setConfirmInvalid] = useState(false);

  const save = async () => {
    if (state.saving || state.mutatingFiles) return;
    const raw = selectSaveYaml(state.valid, state.raw, state.config);
    dispatch({ type: 'saveStarted' });
    try {
      await ClientApis.Problem.uploadProblemConfig(pid, raw).send();
      dispatch({ type: 'saveSucceeded', raw, testdata: state.testdata });
      setConfirmInvalid(false);
      toast.success(t('saveSuccess'));
    } catch (error) {
      dispatch({ type: 'saveFailed' });
      toast.error(error instanceof Error ? error.message : t('saveFailed'));
      return;
    }

    try {
      const testdata = await ClientApis.Problem.refreshProblemTestdata(pid);
      dispatch({ type: 'testdataRefreshed', testdata });
    } catch {
      toast.error(t('refreshFailed'));
    }
  };

  const saveButton = (
    <Button
      type="button"
      disabled={!state.dirty || state.saving || state.mutatingFiles}
      onClick={() => (state.valid ? void save() : setConfirmInvalid(true))}
    >
      <Save className={state.saving ? 'animate-pulse' : undefined} />
      {state.dirty ? (
        <span
          className="text-lg leading-none"
          title={t('unsavedChanges')}
          aria-label={t('unsavedChanges')}
        >
          *
        </span>
      ) : null}
      {state.saving ? t('saving') : t('save')}
    </Button>
  );

  return (
    <div className="space-y-3" data-llm-visible="true">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <main className="grid min-w-0 gap-4 lg:grid-cols-[minmax(18rem,2fr)_minmax(24rem,3fr)]">
          <section
            className="h-[60vh] max-h-[60vh] overflow-hidden rounded-lg bg-muted/20"
            aria-label={t('yamlEditor')}
          >
            <ConfigYamlEditor />
          </section>
          <section className="h-[60vh] max-h-[60vh] overflow-hidden rounded-lg bg-background">
            <ConfigFormPane languageOptions={languageOptions} />
          </section>
        </main>
        <TestdataSidebar pid={pid} docId={docId} title={title} />
      </div>

      <footer className="flex min-h-8 items-center gap-2">
        {saveButton}
        <Button asChild variant="outline">
          <Link href={`/problem/${pid}`}>
            <ArrowLeft />
            <span data-llm-text={problemT('backToProblem')}>
              {problemT('backToProblem')}
            </span>
          </Link>
        </Button>
      </footer>

      <AlertDialog.Root open={confirmInvalid} onOpenChange={setConfirmInvalid}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-5 shadow-lg">
            <AlertDialog.Title className="text-lg font-semibold">
              {t('saveInvalidTitle')}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
              {t('saveInvalidDescription')}
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline" disabled={state.saving}>
                  {t('cancel')}
                </Button>
              </AlertDialog.Cancel>
              <Button
                type="button"
                variant="destructive"
                disabled={state.saving}
                onClick={() => void save()}
              >
                {t('saveRaw')}
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}

export default function ProblemConfigWorkspace(props: Props) {
  return (
    <ProblemConfigProvider raw={props.config} testdata={props.testdata}>
      <Workspace
        pid={props.pid}
        docId={props.docId}
        title={props.title}
        languageOptions={props.languageOptions}
      />
    </ProblemConfigProvider>
  );
}
