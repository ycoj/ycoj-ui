'use client';

import {
  ConfigCheckbox,
  ConfigField,
  MultiSelect,
  SegmentedControl,
  SourceField,
} from './config-controls';
import { useProblemConfig } from './problem-config-context';
import { testlibCheckers } from './problem-config-utils.constants';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import type {
  ProblemCheckerType,
  ProblemConfigFile,
  ProblemType,
} from '@/shared/types/problem-config';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type Props = {
  languageOptions: Array<{ value: string; label: string }>;
};

export default function BasicConfigTab({ languageOptions }: Props) {
  const t = useTranslations('problem.config');
  const { state, dispatch } = useProblemConfig();
  const config = state.config;
  const type = config.type ?? 'default';
  const files = state.testdata
    .map((file) => file.name)
    .filter((name) => name.toLowerCase() !== 'config.yaml');
  const languages = languageOptions.map((language) => language.value);
  const [testlibMode, setTestlibMode] = useState<'preset' | 'custom'>(() => {
    const checker =
      typeof config.checker === 'string'
        ? config.checker
        : config.checker?.file;
    return checker && !checker.includes('.') ? 'preset' : 'custom';
  });

  const update = (patch: Partial<ProblemConfigFile>) => {
    const next = { ...config, ...patch };
    for (const [key, value] of Object.entries(patch)) {
      if (
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      )
        delete next[key as keyof ProblemConfigFile];
    }
    dispatch({ type: 'configChanged', config: next });
  };

  const checkerMode =
    !config.checker_type || ['default', 'strict'].includes(config.checker_type)
      ? 'default'
      : config.checker_type === 'testlib'
        ? 'testlib'
        : 'other';

  return (
    <div className="space-y-7" data-llm-visible="true">
      <section>
        <SegmentedControl
          value={type}
          ariaLabel={t('problemType')}
          options={(
            [
              'default',
              'interactive',
              'communication',
              'submit_answer',
              'objective',
            ] as ProblemType[]
          ).map((value) => ({ value, label: t(`types.${value}`) }))}
          onChange={(value) => update({ type: value })}
        />
        {type === 'remote_judge' ? (
          <p className="text-sm text-muted-foreground">{t('rawOnlyType')}</p>
        ) : null}
      </section>

      {['default', 'submit_answer'].includes(type) ? (
        <section className="space-y-4">
          <h3 className="text-base font-semibold">{t('checker')}</h3>
          <ConfigField label={t('checkerMode')}>
            <SegmentedControl
              value={checkerMode}
              ariaLabel={t('checkerMode')}
              options={(['default', 'testlib', 'other'] as const).map(
                (value) => ({ value, label: t(`checkerModes.${value}`) })
              )}
              onChange={(value) => {
                if (value === 'default')
                  update({ checker_type: 'default', checker: undefined });
                else if (value === 'testlib')
                  update({ checker_type: 'testlib' });
                else update({ checker_type: 'syzoj' });
              }}
            />
          </ConfigField>
          {checkerMode === 'default' ? (
            <ConfigField label={t('whitespace')}>
              <ConfigCheckbox
                checked={config.checker_type !== 'strict'}
                label={t('ignoreWhitespace')}
                onCheckedChange={(checked) =>
                  update({ checker_type: checked ? 'default' : 'strict' })
                }
              />
            </ConfigField>
          ) : null}
          {checkerMode === 'testlib' ? (
            <>
              <ConfigField label={t('checkerSource')}>
                <SegmentedControl
                  value={testlibMode}
                  ariaLabel={t('checkerSource')}
                  options={(['preset', 'custom'] as const).map((value) => ({
                    value,
                    label: t(`checkerSources.${value}`),
                  }))}
                  onChange={(value) => {
                    setTestlibMode(value);
                    update({
                      checker: value === 'preset' ? 'acmp' : undefined,
                    });
                  }}
                />
              </ConfigField>
              {testlibMode === 'preset' ? (
                <ConfigField label={t('preset')}>
                  <Select
                    value={
                      typeof config.checker === 'string'
                        ? config.checker
                        : 'acmp'
                    }
                    onValueChange={(checker) => update({ checker })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {testlibCheckers.map((checker) => (
                        <SelectItem key={checker} value={checker}>
                          {checker}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </ConfigField>
              ) : (
                <ConfigField label={t('checkerFile')}>
                  <SourceField
                    value={config.checker}
                    files={files}
                    languageOptions={languages}
                    fileLabel={t('checkerFile')}
                    languageLabel={t('sourceLanguage')}
                    noneLabel={t('none')}
                    onChange={(checker) => update({ checker })}
                  />
                </ConfigField>
              )}
            </>
          ) : null}
          {checkerMode === 'other' ? (
            <>
              <ConfigField label={t('checkerFormat')}>
                <Select
                  value={config.checker_type ?? 'syzoj'}
                  onValueChange={(checkerType) =>
                    update({ checker_type: checkerType as ProblemCheckerType })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['syzoj', 'hustoj', 'qduoj', 'lemon', 'kattis'].map(
                      (checker) => (
                        <SelectItem key={checker} value={checker}>
                          {checker}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </ConfigField>
              <ConfigField label={t('checkerFile')}>
                <SourceField
                  value={config.checker}
                  files={files}
                  languageOptions={languages}
                  fileLabel={t('checkerFile')}
                  languageLabel={t('sourceLanguage')}
                  noneLabel={t('none')}
                  onChange={(checker) => update({ checker })}
                />
              </ConfigField>
            </>
          ) : null}
        </section>
      ) : null}

      {type === 'interactive' ? (
        <section>
          <ConfigField label={t('interactor')}>
            <SourceField
              value={config.interactor}
              files={files}
              languageOptions={languages}
              fileLabel={t('interactor')}
              languageLabel={t('sourceLanguage')}
              noneLabel={t('none')}
              onChange={(interactor) => update({ interactor })}
            />
          </ConfigField>
        </section>
      ) : null}

      {type === 'communication' ? (
        <section className="space-y-4">
          <h3 className="text-base font-semibold">{t('communication')}</h3>
          <ConfigField label={t('manager')}>
            <SourceField
              value={config.manager}
              files={files}
              languageOptions={languages}
              fileLabel={t('manager')}
              languageLabel={t('sourceLanguage')}
              noneLabel={t('none')}
              onChange={(manager) => update({ manager })}
            />
          </ConfigField>
          <ConfigField label={t('processes')}>
            <Input
              type="number"
              min={1}
              max={5}
              value={config.num_processes ?? 1}
              onChange={(event) =>
                update({
                  num_processes: Math.min(
                    5,
                    Math.max(1, Number(event.target.value) || 1)
                  ),
                })
              }
            />
          </ConfigField>
        </section>
      ) : null}

      {type === 'submit_answer' ? (
        <section className="space-y-4">
          <h3 className="text-base font-semibold">{t('submitAnswer')}</h3>
          <ConfigField label={t('answerMode')}>
            <SegmentedControl
              value={config.subType === 'multi' ? 'multi' : 'single'}
              ariaLabel={t('answerMode')}
              options={(['single', 'multi'] as const).map((value) => ({
                value,
                label: t(`answerModes.${value}`),
              }))}
              onChange={(subType) => update({ subType })}
            />
          </ConfigField>
          <ConfigField label={t('resultDetail')}>
            <Select
              value={typeof config.detail === 'string' ? config.detail : 'full'}
              onValueChange={(detail) =>
                update({ detail: detail as 'full' | 'case' | 'none' })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['full', 'case', 'none'] as const).map((detail) => (
                  <SelectItem key={detail} value={detail}>
                    {t(`details.${detail}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ConfigField>
        </section>
      ) : null}

      {type === 'default' ? (
        <section>
          <ConfigField label={t('filename')}>
            <Input
              value={config.filename ?? ''}
              aria-label={t('filename')}
              placeholder={t('filenamePlaceholder')}
              onChange={(event) => update({ filename: event.target.value })}
            />
          </ConfigField>
        </section>
      ) : null}

      {['default', 'interactive'].includes(type) ? (
        <section className="space-y-4">
          <ConfigField label={t('multiPass')}>
            <ConfigCheckbox
              checked={(config.multi_pass ?? 0) > 1}
              label={t('enabled')}
              onCheckedChange={(checked) =>
                update({ multi_pass: checked ? 2 : undefined })
              }
            />
          </ConfigField>
          {(config.multi_pass ?? 0) > 1 ? (
            <ConfigField label={t('maxPasses')}>
              <Input
                type="number"
                min={2}
                max={20}
                value={config.multi_pass}
                onChange={(event) =>
                  update({
                    multi_pass: Math.min(
                      20,
                      Math.max(2, Number(event.target.value) || 2)
                    ),
                  })
                }
              />
            </ConfigField>
          ) : null}
        </section>
      ) : null}

      {!['submit_answer', 'objective'].includes(type) ? (
        <section className="space-y-4">
          <h3 className="text-base font-semibold">{t('restrictions')}</h3>
          <ConfigField label={t('userExtraFiles')}>
            <MultiSelect
              label={t('userExtraFiles')}
              values={config.user_extra_files ?? []}
              options={files.map((file) => ({ value: file, label: file }))}
              placeholder={t('selectFiles')}
              onChange={(userExtraFiles) =>
                update({ user_extra_files: userExtraFiles })
              }
            />
          </ConfigField>
          <ConfigField label={t('judgeExtraFiles')}>
            <MultiSelect
              label={t('judgeExtraFiles')}
              values={config.judge_extra_files ?? []}
              options={files.map((file) => ({ value: file, label: file }))}
              placeholder={t('selectFiles')}
              onChange={(judgeExtraFiles) =>
                update({ judge_extra_files: judgeExtraFiles })
              }
            />
          </ConfigField>
          <ConfigField label={t('allowedLanguages')}>
            <MultiSelect
              label={t('allowedLanguages')}
              values={config.langs ?? []}
              options={languageOptions}
              placeholder={t('unlimited')}
              onChange={(langs) => update({ langs })}
            />
          </ConfigField>
        </section>
      ) : null}
    </div>
  );
}
