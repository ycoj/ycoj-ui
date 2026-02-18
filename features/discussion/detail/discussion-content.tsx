import Markdown from '@/shared/components/markdown';

type Props = {
  content: string;
};

export default function DiscussionContent({ content }: Props) {
  return (
    <section data-llm-visible="true">
      <Markdown>{content}</Markdown>
    </section>
  );
}
