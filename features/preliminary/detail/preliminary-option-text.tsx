import { getAlphabeticId } from '@/features/preliminary/lib/preliminary-utils';
import Markdown from '@/shared/components/markdown';

type Props = {
  index: number;
  text: string;
};

export default function PreliminaryOptionText({ index, text }: Props) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0 font-medium">{getAlphabeticId(index)}.</span>
      <div className="min-w-0 flex-1 [&_.markdown>:nth-last-child(2)]:mb-0!">
        <Markdown>{text}</Markdown>
      </div>
    </div>
  );
}
