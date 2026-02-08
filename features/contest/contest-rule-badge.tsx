import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { RuleTexts, type ContestRule } from '@/shared/types/contest';
import { ChampionIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

type Props = {
  rule: ContestRule;
};

function getRuleStyle(rule: ContestRule) {
  return cn(
    rule === 'acm' &&
      'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    rule === 'oi' &&
      'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
    (rule === 'ioi' || rule === 'strictioi') &&
      'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400',
    rule === 'homework' &&
      'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
    rule === 'ledo' &&
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
  );
}

export default function ContestRuleBadge({ rule }: Props) {
  const ruleText = RuleTexts[rule];
  const styleClass = getRuleStyle(rule);

  return (
    <Badge variant="secondary" className={styleClass}>
      <HugeiconsIcon icon={ChampionIcon} />
      <span data-llm-text={ruleText}>{ruleText}</span>
    </Badge>
  );
}
