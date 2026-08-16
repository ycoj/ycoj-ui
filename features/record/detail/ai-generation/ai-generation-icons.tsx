import type { AiTraceMessage } from '@/shared/types/record';
import {
  CheckCircle2,
  FilePenLine,
  FileSearch,
  LoaderCircle,
  Terminal,
  Wrench,
} from 'lucide-react';

export function TraceIcon({
  state,
  runningLabel,
  completedLabel,
}: {
  state: AiTraceMessage['state'];
  runningLabel: string;
  completedLabel: string;
}) {
  if (state === 'running') {
    return (
      <LoaderCircle
        className="size-4 animate-spin"
        aria-label={runningLabel}
        role="img"
      />
    );
  }
  return (
    <CheckCircle2 className="size-4" aria-label={completedLabel} role="img" />
  );
}

export function ToolIcon({
  tool,
  running = false,
  runningLabel,
}: {
  tool: string | null;
  running?: boolean;
  runningLabel: string;
}) {
  if (running) {
    return (
      <LoaderCircle
        className="size-4 animate-spin"
        aria-label={runningLabel}
        role="img"
      />
    );
  }

  switch (tool?.toLowerCase()) {
    case 'read':
      return <FileSearch className="size-4" />;
    case 'edit':
      return <FilePenLine className="size-4" />;
    case 'shell':
      return <Terminal className="size-4" />;
    default:
      return <Wrench className="size-4" />;
  }
}
