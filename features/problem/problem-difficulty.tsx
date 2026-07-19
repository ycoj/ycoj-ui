import { Badge } from '@/shared/components/ui/badge';
import {
  PROBLEMS_DIFFICULTY_KEYS,
  PROBLEMS_DIFFICULTY_COLOR,
} from '@/shared/configs/difficulty';
import { useTranslations } from 'next-intl';

export type Props = {
  difficulty?: number;
};

export default function ProblemDifficulty({ difficulty }: Props) {
  const t = useTranslations('difficulty');
  if (!difficulty || typeof difficulty !== 'number') difficulty = 0;
  if (difficulty < 0 || difficulty > 7) difficulty = 0;
  const bgColor = PROBLEMS_DIFFICULTY_COLOR[difficulty];
  const label = t(PROBLEMS_DIFFICULTY_KEYS[difficulty] ?? 'unrated');

  return (
    <Badge style={{ backgroundColor: bgColor }}>
      <span className="text-white" data-llm-text={label}>
        {label}
      </span>
    </Badge>
  );
}
