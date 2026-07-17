import MarkdownPdf from './components/markdown-pdf';
import MarkdownUserSpan from './components/markdown-user-span';
import ProblemSample from './components/problem-sample';
import KatexClientRender from './katex-client-render';
import './markdown.css';
import '@/shared/components/code/style/both.css';
import rehypeUserSpan from '@/shared/components/markdown/plugins/rehype-user-span';
import remarkPdf from '@/shared/components/markdown/plugins/remark-pdf';
import remarkProblemSamples from '@/shared/components/markdown/plugins/remark-problem-samples';
import 'katex/dist/katex.min.css';
import { MarkdownAsync } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStarryNight from 'rehype-starry-night';
import remarkGfm from 'remark-gfm';

const markdownSanitizeSchema = {
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
} as const;

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <MarkdownAsync
        remarkPlugins={[remarkGfm, remarkPdf, remarkProblemSamples]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, markdownSanitizeSchema],
          rehypeUserSpan,
          rehypeStarryNight,
        ]}
        components={{
          // @ts-expect-error pdf-embed is a custom element
          'pdf-embed': MarkdownPdf,
          samples: ProblemSample,
          'user-span': MarkdownUserSpan,
        }}
      >
        {children}
      </MarkdownAsync>
      <KatexClientRender source={children} />
    </div>
  );
}
