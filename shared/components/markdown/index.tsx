import {
  ObjectiveDropdown,
  ObjectiveInput,
  ObjectiveMultiselect,
  ObjectiveOption,
  ObjectiveSelect,
  ObjectiveTextarea,
} from '@/features/problem/objective/controls';
import '@/shared/components/code/style/both.css';
import MarkdownPdf from '@/shared/components/markdown/components/markdown-pdf';
import MarkdownUserSpan from '@/shared/components/markdown/components/markdown-user-span';
import ProblemSample from '@/shared/components/markdown/components/problem-sample';
import KatexClientRender from '@/shared/components/markdown/katex-client-render';
import { preserveLatexLineBreaks } from '@/shared/components/markdown/latex-line-breaks';
import '@/shared/components/markdown/markdown.css';
import rehypeObjective from '@/shared/components/markdown/plugins/rehype-objective';
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

const objectiveSanitizeSchema = {
  ...markdownSanitizeSchema,
  tagNames: [
    ...(markdownSanitizeSchema.tagNames ?? []),
    'objective-input',
    'objective-textarea',
    'objective-dropdown',
    'objective-select',
    'objective-multiselect',
    'objective-option',
  ],
  attributes: {
    ...markdownSanitizeSchema.attributes,
    'objective-input': [
      ['data-id', /^\d+(-\d+)?$/],
      ['dataId', /^\d+(-\d+)?$/],
    ],
    'objective-textarea': [
      ['data-id', /^\d+(-\d+)?$/],
      ['dataId', /^\d+(-\d+)?$/],
    ],
    'objective-dropdown': [
      ['data-id', /^\d+(-\d+)?$/],
      ['dataId', /^\d+(-\d+)?$/],
      'data-options',
      'dataOptions',
    ],
    'objective-select': [
      ['data-id', /^\d+(-\d+)?$/],
      ['dataId', /^\d+(-\d+)?$/],
    ],
    'objective-multiselect': [
      ['data-id', /^\d+(-\d+)?$/],
      ['dataId', /^\d+(-\d+)?$/],
    ],
    'objective-option': [
      ['data-value', /^.+$/],
      ['dataValue', /^.+$/],
      'data-value',
      'dataValue',
    ],
  },
} as const;

export { markdownSanitizeSchema, objectiveSanitizeSchema };

export default function Markdown({
  children,
  objective,
}: {
  children: string;
  objective?: boolean;
}) {
  const markdownSource = preserveLatexLineBreaks(children);
  const sanitizeSchema = objective
    ? objectiveSanitizeSchema
    : markdownSanitizeSchema;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rehypePlugins: any[] = objective
    ? [
        rehypeRaw,
        rehypeObjective,
        [rehypeSanitize, sanitizeSchema],
        rehypeUserSpan,
        rehypeStarryNight,
      ]
    : [
        rehypeRaw,
        [rehypeSanitize, sanitizeSchema],
        rehypeUserSpan,
        rehypeStarryNight,
      ];

  return (
    <div className="markdown">
      <MarkdownAsync
        remarkPlugins={[remarkGfm, remarkPdf, remarkProblemSamples]}
        rehypePlugins={rehypePlugins}
        components={{
          // @ts-expect-error pdf-embed is a custom element
          'pdf-embed': MarkdownPdf,
          samples: ProblemSample,
          'user-span': MarkdownUserSpan,
          'objective-input': ObjectiveInput,
          'objective-textarea': ObjectiveTextarea,
          'objective-dropdown': ObjectiveDropdown,
          'objective-select': ObjectiveSelect,
          'objective-multiselect': ObjectiveMultiselect,
          'objective-option': ObjectiveOption,
        }}
      >
        {markdownSource}
      </MarkdownAsync>
      <KatexClientRender source={children} />
    </div>
  );
}
