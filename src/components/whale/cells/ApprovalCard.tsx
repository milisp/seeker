import { ShieldAlert, X, Check, FastForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWhaleStore } from '@/components/whale/useWhaleStore';
import { ToolCallCard, FileChangeEvent } from './ToolCall';
import { ApprovalPayload } from '../types';

interface ApprovalCardProps {
  approval: ApprovalPayload;
}

export function ApprovalCard({ approval }: ApprovalCardProps) {
  const { decideApproval, currentThreadId, events } = useWhaleStore();

  const threadEvents = currentThreadId ? (events[currentThreadId] ?? []) : [];

  // Find the item.started event (file_change or tool_call) whose tool.id matches this approval id
  const matchingEvent = threadEvents.find(
    (ev) =>
      ev.method === 'item.started' &&
      (ev.params.payload?.tool as any)?.id === approval.id
  );
  const matchingKind = matchingEvent?.params.item?.kind as string | undefined;

  return (
    <div
      key={approval.id}
      className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 backdrop-blur-md p-5 flex flex-col gap-4 shadow-lg shadow-yellow-500/5 animate-pulse-slow"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-yellow-500/10 text-yellow-600 shrink-0">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-foreground">Action Approval Required</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review the pending action before allowing the agent to proceed.
          </p>
        </div>
      </div>

      {matchingKind === 'file_change' ? (
        <div className="rounded border bg-card overflow-hidden">
          <FileChangeEvent ev={matchingEvent!} />
        </div>
      ) : matchingEvent ? (
        <div className="rounded border bg-card p-3">
          <ToolCallCard ev={matchingEvent} />
        </div>
      ) : (
        <div className="rounded border bg-card p-3 font-mono text-xs text-foreground/80 leading-relaxed max-h-[140px] overflow-y-auto">
          <div className="font-bold text-yellow-600 mb-1">Tool: {approval.tool_name}</div>
          <div>{approval.description || 'No execution description provided.'}</div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-8 text-rose-600 border-rose-500/20 hover:bg-rose-500/10"
          onClick={() => decideApproval(approval.id, 'deny', false)}
        >
          <X className="h-3.5 w-3.5 mr-1" /> Deny
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="text-xs h-8 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10"
          onClick={() => decideApproval(approval.id, 'allow', true)}
        >
          <FastForward className="h-3.5 w-3.5 mr-1" /> Always Approve
        </Button>

        <Button
          size="sm"
          className="text-xs h-8 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md border-0"
          onClick={() => decideApproval(approval.id, 'allow', false)}
        >
          <Check className="h-3.5 w-3.5 mr-1" /> Approve Once
        </Button>
      </div>
    </div>
  );
}