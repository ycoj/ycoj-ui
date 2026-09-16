import '@/shared/components/code/style/both.css';
import MarkdownAlert from '@/shared/components/markdown/components/markdown-alert';
import MarkdownAlign from '@/shared/components/markdown/components/markdown-align';
import MarkdownCodeBlock from '@/shared/components/markdown/components/markdown-code-block';
import MarkdownPdf from '@/shared/components/markdown/components/markdown-pdf';
import MarkdownUserSpan from '@/shared/components/markdown/components/markdown-user-span';
import ProblemSample from '@/shared/components/markdown/components/problem-sample';
import KatexClientRender from '@/shared/components/markdown/katex-client-render';
import { preserveLatexLineBreaks } from '@/shared/components/markdown/latex-line-breaks';
import '@/shared/components/markdown/markdown.css';
import rehypeUserSpan from '@/shared/components/markdown/plugins/rehype-user-span';
import remarkContainers from '@/shared/components/markdown/plugins/remark-containers';
import remarkPdf from '@/shared/components/markdown/plugins/remark-pdf';
import remarkProblemSamples from '@/shared/components/markdown/plugins/remark-problem-samples';
import type { Root } from 'hast';
import 'katex/dist/katex.min.css';
import { MarkdownAsync } from 'react-markdown';
import type { Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Options as Schema } from 'rehype-sanitize';
import rehypeStarryNight from 'rehype-starry-night';
import remarkGfm from 'remark-gfm';
import 'server-only';
import type { Plugin } from 'unified';
import type { PluggableList } from 'unified';

// `rehype-starry-night` builds its highlighter (loading every common grammar)
// when a processor freezes the plugin, and `MarkdownAsync` freezes a new
// processor for every rendered block. Pages that render many blocks (for
// example the preliminary detail view renders one per question and option)
// would rebuild the highlighter hundreds of times per request. Build one
// transformer and register it through a stable plugin instead.
const starryNightTransformer = rehypeStarryNight();
const rehypeStarryNightShared: Plugin<[], Root, Root> = () =>
  starryNightTransformer;

export const markdownSanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'pdf-embed',
    'samples',
    'user-span',
    'md-alert',
    'md-align',
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
    'md-alert': [
      ['dataVariant', /^(info|warning|success|error)$/],
      ['data-variant', /^(info|warning|success|error)$/],
      'dataTitle',
      'data-title',
    ],
    'md-align': [
      ['dataAlign', /^(center|left|right)$/],
      ['data-align', /^(center|left|right)$/],
    ],
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
    rehypeStarryNightShared,
  ];

  return (
    <div className="markdown">
      <MarkdownAsync
        remarkPlugins={[
          remarkGfm,
          remarkPdf,
          remarkProblemSamples,
          remarkContainers,
        ]}
        rehypePlugins={rehypePluginsWithSanitize}
        components={{
          // @ts-expect-error pdf-embed is a custom element
          'pdf-embed': MarkdownPdf,
          samples: ProblemSample,
          'user-span': MarkdownUserSpan,
          'md-alert': MarkdownAlert,
          'md-align': MarkdownAlign,
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
