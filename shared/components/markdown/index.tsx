import './markdown.css';
import ProblemSample from './problem-sample';
import '@/shared/components/code/style/both.css';
import remarkProblemSamples from '@/shared/components/markdown/plugins/remark-problem-samples';
import 'katex/dist/katex.min.css';
import { MarkdownAsync } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeStarryNight from 'rehype-starry-night';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <MarkdownAsync
        remarkPlugins={[remarkGfm, remarkMath, remarkProblemSamples]}
        rehypePlugins={[rehypeKatex, rehypeStarryNight]}
        components={{
          // @ts-expect-error samples is a custom element
          samples: ProblemSample,
        }}
      >
        {children}
      </MarkdownAsync>
    </div>
  );
}
