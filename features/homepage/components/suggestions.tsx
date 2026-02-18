import type { SuggestionSection } from '@/api/server/method/ui/homepage';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Globe } from 'lucide-react';
import Link from 'next/link';

export default function Suggestions({
  sections,
}: {
  sections: SuggestionSection[];
}) {
  const visibleSections = sections.filter(
    (section) => section.sites.length > 0
  );
  if (!visibleSections.length) return null;

  return (
    <Card data-llm-visible="true">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="size-5" />
          <span data-llm-text="推荐">推荐</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visibleSections.map((section, index) => (
            <div data-llm-visible="true" key={`${section.title}-${index}`}>
              <div className="space-y-2">
                <p
                  data-llm-text={section.title}
                  className="text-sm font-medium text-foreground"
                >
                  {section.title}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                  {section.sites.map((site, siteIndex) => (
                    <Link
                      key={`${site.title}-${site.link}-${siteIndex}`}
                      href={site.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-llm-text={site.title}
                      className="text-muted-foreground hover:text-foreground inline-flex max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm underline-offset-4 hover:underline"
                    >
                      {site.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
