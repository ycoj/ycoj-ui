'use client';

import type { BulkSubmitTreeNode } from '@/features/contest/management/management-utils';
import { cn } from '@/shared/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  FileArchive,
  FileCode2,
  Folder,
  FolderOpen,
  MoreHorizontal,
} from 'lucide-react';
import { useState } from 'react';

type TreeItemProps = {
  node: BulkSubmitTreeNode;
  defaultExpanded?: boolean;
};

function TreeItem({ node, defaultExpanded = true }: TreeItemProps) {
  const expandable = Boolean(node.children?.length);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const Icon =
    node.type === 'archive'
      ? FileArchive
      : node.type === 'file'
        ? FileCode2
        : node.type === 'ellipsis'
          ? MoreHorizontal
          : expanded
            ? FolderOpen
            : Folder;
  const content = (
    <>
      {expandable ? (
        expanded ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )
      ) : (
        <span className="size-4" aria-hidden="true" />
      )}
      <Icon
        className={cn(
          'size-4 shrink-0',
          node.type === 'file' && 'text-sky-600 dark:text-sky-400',
          (node.type === 'folder' || node.type === 'archive') &&
            'text-amber-600 dark:text-amber-400',
          node.type === 'ellipsis' && 'text-muted-foreground'
        )}
      />
      <span className="truncate" data-llm-text={node.name}>
        {node.name}
      </span>
    </>
  );

  return (
    <div
      role="treeitem"
      aria-selected={false}
      aria-expanded={expandable ? expanded : undefined}
      className="min-w-0"
    >
      {expandable ? (
        <button
          type="button"
          className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-muted"
          onClick={() => setExpanded((value) => !value)}
        >
          {content}
        </button>
      ) : (
        <div className="flex h-8 items-center gap-2 px-2 text-sm">
          {content}
        </div>
      )}
      {expandable && expanded && (
        <div role="group" className="ml-4 border-l pl-2">
          {node.children?.map((child) => (
            <TreeItem key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

type Props = {
  tree: BulkSubmitTreeNode;
  label: string;
};

export default function BulkSubmitTreeView({ tree, label }: Props) {
  return (
    <div
      role="tree"
      aria-label={label}
      className="py-2"
      data-llm-visible="true"
    >
      <TreeItem node={tree} />
    </div>
  );
}
