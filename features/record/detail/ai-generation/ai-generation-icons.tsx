import type { AiTraceMessage } from '@/shared/types/record';
import {
  Ban,
  CheckCircle2,
  CircleX,
  ClockAlert,
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
  failedLabel,
  cancelledLabel,
  timedOutLabel,
}: {
  state: AiTraceMessage['state'];
  runningLabel: string;
  completedLabel: string;
  failedLabel: string;
  cancelledLabel: string;
  timedOutLabel: string;
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

  switch (state) {
    case 'succeeded':
      return (
        <CheckCircle2
          className="size-4"
          aria-label={completedLabel}
          role="img"
        />
      );
    case 'failed':
      return <CircleX className="size-4" aria-label={failedLabel} role="img" />;
    case 'cancelled':
      return <Ban className="size-4" aria-label={cancelledLabel} role="img" />;
    case 'timed_out':
      return (
        <ClockAlert className="size-4" aria-label={timedOutLabel} role="img" />
      );
  }
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
