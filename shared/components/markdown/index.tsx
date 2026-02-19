import MarkdownUserSpan from './components/markdown-user-span';
import ProblemSample from './components/problem-sample';
import KatexClientRender from './katex-client-render';
import './markdown.css';
import '@/shared/components/code/style/both.css';
import rehypeUserSpan from '@/shared/components/markdown/plugins/rehype-user-span';
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
        remarkPlugins={[remarkGfm, remarkProblemSamples]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, markdownSanitizeSchema],
          rehypeUserSpan,
          rehypeStarryNight,
        ]}
        components={{
          // @ts-expect-error samples is a custom element
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
