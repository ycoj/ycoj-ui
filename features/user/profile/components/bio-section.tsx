import { getProfileExtras, type UserProfileProps } from './shared';
import Markdown from '@/shared/components/markdown';
import { FileText } from 'lucide-react';

export default function BioSection({ data }: UserProfileProps) {
  const extras = getProfileExtras(data);
  const bio = extras.bio;

  return (
    <section className="space-y-3" data-llm-visible="true">
      <h2 className="inline-flex items-center gap-2 text-base font-medium">
        <FileText className="size-4 text-muted-foreground" />
        <span data-llm-text="个人简介">个人简介</span>
      </h2>

      {bio ? (
        <div className="overflow-hidden rounded-lg border px-4 py-3">
          <Markdown>{bio}</Markdown>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground" data-llm-text="暂无简介">
          暂无简介
        </p>
      )}
    </section>
  );
}
