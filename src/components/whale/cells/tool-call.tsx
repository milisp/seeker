import { useState } from 'react';
import DiffViewer from '@/components/diff-viewer';
import {
  ChevronRight,
  ChevronDown,
  Terminal,
  Search,
  FileText,
  FilePenLine,
  ListChecks,
  Wrench,
  Globe2,
  XCircle,
  Loader2,
} from 'lucide-react';
import type { WhaleEvent } from '../types';
import { useWhaleStore } from '../use-whale-store';

// ---------------------------------------------------------------------------
// Tool helpers
// ---------------------------------------------------------------------------

function getToolIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('shell') || n.includes('exec') || n.includes('command')) return Terminal;
  if (n.includes('search') || n.includes('grep') || n.includes('find')) return Search;
  if (n.includes('read')) return FileText;
  if (n.includes('write') || n.includes('edit') || n.includes('patch')) return FilePenLine;
  if (n.includes('plan') || n.includes('checklist') || n.includes('todo')) return ListChecks;
  if (n.includes('web') || n.includes('fetch') || n.includes('url')) return Globe2;
  return Wrench;
}

function getToolLabel(name: string): string {
  switch (name.toLowerCase()) {
    case 'exec_shell': return 'Run';
    case 'read_file': return 'Read';
    case 'write_file': return 'Write';
    case 'edit_file': return 'Edit';
    case 'grep_files': return 'Search';
    case 'apply_patch': return 'Apply patch';
    case 'checklist_write': return 'Update Plan';
    default: return name;
  }
}

function getInputSummary(name: string, input?: Record<string, any>): string {
  if (!input) return '';
  const n = name.toLowerCase();
  if (n === 'exec_shell' || n.includes('shell')) return (input.command as string) ?? '';
  if (n === 'read_file' || n === 'write_file' || n === 'edit_file' || n === 'apply_patch')
    return (input.path as string) ?? '';
  if (n === 'grep_files') return (input.pattern as string) ?? '';
  // generic: first short string value
  for (const v of Object.values(input)) {
    if (typeof v === 'string' && v.trim()) return v.trim().slice(0, 120);
  }
  return '';
}

// ---------------------------------------------------------------------------
// ToolCallItem — collapsible card for every tool invocation
// ---------------------------------------------------------------------------

/**
 * A collapsible card rendered from an item.started event.
 *
 * Collapsed: [▶] [Icon] Label  inputSummary          [status icon]
 * Expanded:  shows output text, diff viewer, or checklist depending on tool.
 *
 * Reads `outputEvent` reactively from the store so the card updates from
 * "running → success/failed" without needing a separate item.completed render.
 */
export function ToolCallItem({
  itemId,
  inputEvent,
}: {
  itemId: string;
  inputEvent: WhaleEvent;
}) {
  const [expanded, setExpanded] = useState(false);
  const { toolCallEventsByItemId } = useWhaleStore();
  const outputEvent = toolCallEventsByItemId[itemId]?.outputEvent;

  const tool = inputEvent.params.payload?.tool;
  const toolName = (tool?.name as string) ?? 'tool';
  const toolInput = tool?.input as Record<string, any> | undefined;
  const output = (outputEvent?.params.item?.detail as string) ?? '';
  const isRunning = !outputEvent;
  const isFailed = outputEvent?.method === 'item.failed';

  const Icon = getToolIcon(toolName);
  const label = getToolLabel(toolName);
  const summary = getInputSummary(toolName, toolInput);

  // Detect file-change tools to render diffs instead of text output
  const isWriteFile = toolName === 'write_file';
  const isEditFile = toolName === 'edit_file';
  const isChecklistWrite = toolName === 'checklist_write';

  return (
    <div className="overflow-hidden">
      {/* Header row — always visible */}
      <button
        type="button"
        className="group flex items-center gap-2 w-full p-2 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-foreground shrink-0">{label}</span>
        {summary && (
          <span className="text-xs text-muted-foreground font-mono shrink-0">
            {summary}
          </span>
        )}
        <div className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {expanded
            ? <ChevronDown className="h-3.5 w-3.5" />
            : <ChevronRight className="h-3.5 w-3.5" />}
        </div>
        <div className="shrink-0">
          {isRunning ? (
            <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
          ) : isFailed ? (
            <XCircle className="h-4 w-4 text-rose-500" />
          ) : null}
        </div>
      </button>

      {/* Expandable detail */}
      {expanded && (
        <div>
          {isWriteFile && toolInput?.content ? (
            <DiffViewer
              oldCode=""
              newCode={toolInput.content as string}
              filename={(toolInput.path as string) ?? ''}
              statusText="Created"
            />
          ) : isEditFile && toolInput?.search && toolInput?.replace ? (
            <DiffViewer
              oldCode={toolInput.search as string}
              newCode={toolInput.replace as string}
              filename={(toolInput.path as string) ?? ''}
              statusText="Edited"
            />
          ) : isChecklistWrite && toolInput?.todos ? (
            <div className="px-3 py-2.5 text-sm space-y-0.5">
              {(toolInput.todos as { content: string; status: string }[]).map(
                (todo, i) => (
                  <div key={i}>
                    {todo.status === 'completed' ? '✔' : '☐'} {todo.content}
                  </div>
                ),
              )}
            </div>
          ) : output ? (
            <pre className="px-3 py-2.5 text-xs whitespace-pre-wrap break-all text-foreground/80 max-h-[300px] overflow-auto leading-relaxed">
              {output}
            </pre>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Backward-compat exports (used by approval-card.tsx)
// ---------------------------------------------------------------------------

export function ToolCallCard({ ev }: { ev: WhaleEvent }) {
  return (
    <ToolCallItem
      itemId={(ev.params.item_id as string) ?? ''}
      inputEvent={ev}
    />
  );
}

export function FileChangeEvent({ ev }: { ev: WhaleEvent }) {
  return (
    <ToolCallItem
      itemId={(ev.params.item_id as string) ?? ''}
      inputEvent={ev}
    />
  );
}
