import { getSafePdfUrl } from '@/shared/components/markdown/pdf-url';

type MdastNode = {
  type: string;
  children?: MdastNode[];
  data?: Record<string, unknown>;
  title?: string | null;
  url?: string;
  value?: string;
};

function getPdfUrl(node: MdastNode): string | null {
  if (node.type !== 'paragraph' || node.children?.length !== 2) return null;

  const [marker, link] = node.children;
  if (marker?.type !== 'text' || marker.value !== '@') return null;
  if (link?.type !== 'link' || link.title != null) return null;
  if (link.children?.length !== 1) return null;

  const [label] = link.children;
  if (label?.type !== 'text' || label.value !== 'pdf') return null;

  return getSafePdfUrl(link.url);
}

function transformNode(node: MdastNode) {
  const pdfUrl = getPdfUrl(node);
  if (pdfUrl) {
    node.children = [];
    node.data = {
      hName: 'pdf-embed',
      hProperties: {
        'data-src': pdfUrl,
      },
    };
    return;
  }

  for (const child of node.children ?? []) {
    transformNode(child);
  }
}

export default function remarkPdf() {
  return (tree: MdastNode) => {
    transformNode(tree);
  };
}
