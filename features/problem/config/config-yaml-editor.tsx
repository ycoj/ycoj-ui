'use client';

import { useProblemConfig } from './problem-config-context';
import CodeEditor from '@/shared/components/code/code-editor';
import { useTranslations } from 'next-intl';

export default function ConfigYamlEditor() {
  const t = useTranslations('problem.config');
  const { state, dispatch } = useProblemConfig();

  return (
    <CodeEditor
      value={state.raw}
      language="yaml"
      height="100%"
      invalid={!state.valid}
      ariaLabel={t('yamlEditor')}
      path="problem-config.yaml"
      className="h-full min-h-96 rounded-none border-0"
      onChange={(raw) => dispatch({ type: 'rawChanged', raw })}
    />
  );
}
