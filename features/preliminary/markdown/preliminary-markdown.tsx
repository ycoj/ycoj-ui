import { wrapCircledMarkers } from '@/features/preliminary/lib/preliminary-circled-markers';
import Markdown from '@/shared/components/markdown';
import MarkdownCodeBlock from '@/shared/components/markdown/components/markdown-code-block';
import type { HTMLAttributes } from 'react';
import type { ExtraProps } from 'react-markdown';

type CodeBlockProps = HTMLAttributes<HTMLPreElement> & ExtraProps;

function PreliminaryCodeBlock({ children, ...props }: CodeBlockProps) {
  return (
    <MarkdownCodeBlock {...props}>
      {wrapCircledMarkers(children)}
    </MarkdownCodeBlock>
  );
}

type Props = {
  children: string;
};

// Preliminary papers mark code-completion blanks with circled digits (①②…),
// which monospace fonts draw much smaller than the surrounding code, so every
// code block gets the marker styling applied on top of the shared renderer.
export default function PreliminaryMarkdown({ children }: Props) {
  return (
    <Markdown components={{ pre: PreliminaryCodeBlock }}>{children}</Markdown>
  );
}
