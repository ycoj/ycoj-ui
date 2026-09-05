import { getAlphabeticId } from '@/features/preliminary/lib/preliminary-utils';
import Markdown from '@/shared/components/markdown';

type Props = {
  index: number;
  text: string;
};

export default function PreliminaryOptionText({ index, text }: Props) {
  return (
    <span className="flex items-start gap-2">
      <span className="shrink-0 font-medium">{getAlphabeticId(index)}.</span>
      <span className="min-w-0 flex-1 [&_.markdown>:last-child]:mb-0">
        <Markdown>{text}</Markdown>
      </span>
    </span>
  );
}
