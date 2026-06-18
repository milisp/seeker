import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useWhaleStore } from '@/components/whale/use-whale-store';
import { AgentLogEvent, ApprovalPayload, ItemInfo, TurnInfo, Usage } from '@/components/whale/types';

export function useWhaleEvents() {
  useEffect(() => {
    const {
      addEvent,
      appendDelta,
      startStreamingItem,
      finishStreamingItem,
      setToolCallEventsByItemId,
      addPendingApproval,
      setThreads,
      setTurnStatusByThread,
      setCurrentTurnStatus,
      setActiveTurnId,
      setActiveApprovalId,
      setUsageByThread,
      addFileChange,
    } = useWhaleStore.getState();

    const unlistens: Promise<() => void>[] = [];

    unlistens.push(
      listen<{ method: string; params: AgentLogEvent }>(
        'whale:notification',
        (event) => {
          const { method, params } = event.payload;
          const threadId = params?.thread_id as string;

          if (!['turn.lifecycle', 'thread.started', 'item.delta', 'approval.required', 'item.interrupted', 'turn.interrupt_requested'].includes(method)) {
            addEvent(threadId, { method, params });
          }

          if (method !== 'item.delta') {
            console.info(`[whale] ${params.seq} ${method}`, params);
          }

          switch (method) {
            case 'item.delta': {
              const turnId = params?.turn_id as string;
              const itemId = params?.item_id as string;
              const delta = params?.payload?.delta as string ?? '';
              appendDelta(threadId, turnId, itemId, delta);
              break;
            }
            case 'turn.started':
            case 'turn.completed':
            case 'turn.failed': {
              const turnId = params?.turn_id as string;
              const turn = params?.turn as TurnInfo;
              setTurnStatusByThread(threadId, turn.status);
              setCurrentTurnStatus(turn.status);
              if (method === 'turn.started') {
                setThreads(
                  useWhaleStore.getState().threads.map((thread) => {
                    if (thread.id === threadId) {
                      return {
                        ...thread,
                        title: turn.input_summary,
                        latest_turn_id: turn.id,
                        latest_turn_status: turn.status,
                        updated_at: turn.created_at,
                      };
                    }
                    return thread;
                  })
                );
                setActiveTurnId(turnId);
              } else {
                setActiveTurnId(null);
              }
              if (method === 'turn.completed') {
                const usage = turn.usage as Usage;
                if (usage) {
                  setUsageByThread(threadId, usage);
                }
              }
              break;
            }
            case 'thread.started':
            case 'turn.lifecycle':
              break;
            case 'item.started':
            case 'item.completed':
            case 'item.failed': {
              const item = params?.item as ItemInfo | undefined;
              const itemId = params?.item_id as string;
              const turnId = params?.turn_id as string;
              // Prefer params.item.kind; fall back to params.payload.kind for backends
              // that don't populate params.item on item.started.
              const kind = (item?.kind ?? params?.payload?.kind) as string;
              if (method === 'item.started') {
                if (!['user_message', 'agent_message'].includes(kind)) {
                  console.log('item.started kind:', kind);
                }
                startStreamingItem(threadId, turnId, itemId, kind);
                // Always store the inputEvent so item.completed can look it up
                // regardless of kind — avoids missing data when kind is undefined.
                setToolCallEventsByItemId(itemId, { method, params });
                const tool = params?.payload?.tool;
                if (tool && turnId && threadId) {
                  const toolName = tool.name as string;
                  if (toolName === 'write_file' || toolName === 'edit_file') {
                    const toolInput = tool.input as Record<string, any> | undefined;
                    if (toolInput) {
                      addFileChange(threadId, turnId, {
                        itemId,
                        toolName,
                        path: (toolInput.path as string) || '',
                        search: toolInput.search as string,
                        replace: toolInput.replace as string,
                        content: toolInput.content as string,
                      });
                    }
                  }
                }
                break;
              }
              finishStreamingItem(threadId, itemId);
              // Store outputEvent for all kinds so tool output is always available.
              setToolCallEventsByItemId(itemId, undefined, { method, params });
              break;
            }
            case 'approval.required': {
              const payload = params.payload as ApprovalPayload;
              const approvalId = payload?.id;
              if (approvalId && threadId) {
                const approvalData = {
                  id: approvalId,
                  tool_name: payload?.tool_name ?? 'unknown_tool',
                  description: payload?.description ?? '',
                  threadId: String(threadId),
                  turnId: String(params.turn_id ?? ''),
                };
                addPendingApproval(String(threadId), approvalData);
                setActiveApprovalId(approvalId);
              }
              break;
            }
            case 'approval.decided': {
              break;
            }
            default: {
            }
          }
        }
      )
    );

    return () => {
      Promise.all(unlistens).then((fns) => fns.forEach((fn) => fn()));
    };
  }, []);
}
