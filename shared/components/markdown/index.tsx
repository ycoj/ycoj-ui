import '@/shared/components/code/style/both.css';
import MarkdownCodeBlock from '@/shared/components/markdown/components/markdown-code-block';
import MarkdownPdf from '@/shared/components/markdown/components/markdown-pdf';
import MarkdownUserSpan from '@/shared/components/markdown/components/markdown-user-span';
import ProblemSample from '@/shared/components/markdown/components/problem-sample';
import KatexClientRender from '@/shared/components/markdown/katex-client-render';
import { preserveLatexLineBreaks } from '@/shared/components/markdown/latex-line-breaks';
import '@/shared/components/markdown/markdown.css';
import rehypeUserSpan from '@/shared/components/markdown/plugins/rehype-user-span';
import remarkPdf from '@/shared/components/markdown/plugins/remark-pdf';
import remarkProblemSamples from '@/shared/components/markdown/plugins/remark-problem-samples';
import 'katex/dist/katex.min.css';
import { MarkdownAsync } from 'react-markdown';
import type { Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Options as Schema } from 'rehype-sanitize';
import rehypeStarryNight from 'rehype-starry-night';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';

export const markdownSanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'pdf-embed',
    'samples',
    'user-span',
    'details',
    'summary',
    'kbd',
    'sub',
    'sup',
  ],
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      ['target', /^_(?:blank|self|parent|top)$/],
      [
        'rel',
        /^(?:noopener|noreferrer|nofollow|ugc|sponsored)(?:\s+(?:noopener|noreferrer|nofollow|ugc|sponsored))*$/,
      ],
    ],
    'pdf-embed': ['dataSrc', 'data-src'],
    samples: [
      ['dataIndex', /^\d+$/],
      'dataInput',
      'dataOutput',
      ['data-index', /^\d+$/],
      'data-input',
      'data-output',
    ],
    'user-span': [
      ['dataUid', /^\d+$/],
      'dataUname',
      'dataMail',
      'dataAvatar',
      ['data-uid', /^\d+$/],
      'data-uname',
      'data-mail',
      'data-avatar',
    ],
  },
};

type Props = {
  children: string;
  rehypePlugins?: PluggableList;
  sanitizeSchema?: Schema;
  components?: Components;
};

export default function Markdown({
  children,
  rehypePlugins = [],
  sanitizeSchema = markdownSanitizeSchema,
  components = {},
}: Props) {
  const markdownSource = preserveLatexLineBreaks(children);
  const rehypePluginsWithSanitize: PluggableList = [
    rehypeRaw,
    ...rehypePlugins,
    [rehypeSanitize, sanitizeSchema],
    rehypeUserSpan,
    rehypeStarryNight,
  ];

  return (
    <div className="markdown">
      <MarkdownAsync
        remarkPlugins={[remarkGfm, remarkPdf, remarkProblemSamples]}
        rehypePlugins={rehypePluginsWithSanitize}
        components={{
          // @ts-expect-error pdf-embed is a custom element
          'pdf-embed': MarkdownPdf,
          samples: ProblemSample,
          'user-span': MarkdownUserSpan,
          pre: MarkdownCodeBlock,
          ...components,
        }}
      >
        {markdownSource}
      </MarkdownAsync>
      <KatexClientRender source={children} />
    </div>
  );
}
