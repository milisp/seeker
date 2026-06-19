import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { WhaleProviderId, ThreadListResponse, WhaleEvent, WhaleMode, TurnStatus, Usage, WhaleFileChange } from '@/components/whale/types';

export type ReasoningEffort = 'auto' | 'off' | 'high' | 'max';
export type Prompt = string | null
export type ToolCallEvent = { inputEvent?: WhaleEvent, outputEvent?: WhaleEvent };

interface WhaleStore {
  // Model / mode selection (persisted)
  providerId: WhaleProviderId;
  model: string;
  mode: WhaleMode;
  currentReasoningEffort: ReasoningEffort;
  prompt: Prompt;
  setPrompt: (prompt: Prompt) => void;

  // Connection state
  unavailable: boolean;

  focusTrigger: number;
  triggerFocus: () => void;

  // Thread state
  threads: ThreadListResponse[];
  currentThreadId: string | null;
  currentTurnStatus: TurnStatus;
  turnStatusByThread: Record<string, TurnStatus>;
  activeTurnId: string | null;
  activeApprovalId: string | null;
  pendingApprovals: Record<string, any[]>;

  // Streaming events per thread
  events: Record<string, WhaleEvent[]>;

  // Accumulated delta text, keyed by "thread_id:turn_id:item_id"
  deltaBuffers: Record<string, string>;

  // Items currently streaming (item.started → item.completed/failed)
  streamingItems: Record<string, { threadId: string; turnId: string; itemId: string; kind: string }[]>;

  // tool call events by itemId
  toolCallEventsByItemId: Record<string, ToolCallEvent>;

  // Actions
  setProvider: (providerId: WhaleProviderId, model: string) => void;
  setModel: (model: string) => void;
  setMode: (mode: WhaleMode) => void;
  setReasoningEffort: (effort: ReasoningEffort) => void;
  setCurrentTurnStatus: (status: TurnStatus) => void;
  setTurnStatusByThread: (threadId: string, status: TurnStatus) => void;
  setActiveTurnId: (id: string | null) => void;
  setActiveApprovalId: (id: string | null) => void;
  setUnavailable: (v: boolean) => void;
  setThreads: (threads: ThreadListResponse[]) => void;
  setCurrentThreadId: (id: string | null) => Promise<void>;
  addEvent: (threadId: string, event: WhaleEvent) => void;
  appendDelta: (threadId: string, turnId: string, itemId: string, delta: string) => void;
  startStreamingItem: (threadId: string, turnId: string, itemId: string, kind: string) => void;
  finishStreamingItem: (threadId: string, itemId: string) => void;
  setToolCallEventsByItemId: (itemId: string, inputEvent?: WhaleEvent, outputEvent?: WhaleEvent) => void;
  addPendingApproval: (threadId: string, approval: any) => void;
  clearPendingApprovals: (threadId: string) => void;
  decideApproval: (
    approvalId: string,
    decision: 'allow' | 'deny',
    remember: boolean,
  ) => Promise<void>;

  // Usage info per thread
  usageByThread: Record<string, Usage>;
  setUsageByThread: (threadId: string, usage: Usage) => void;

  fileChangesByTurn: Record<string, Record<string, WhaleFileChange[]>>;
  addFileChange: (threadId: string, turnId: string, change: WhaleFileChange) => void;
}

export const useWhaleStore = create<WhaleStore>()(
  persist(
    (set, get) => ({
      focusTrigger: 0,
      triggerFocus: () => set((state) => ({ focusTrigger: state.focusTrigger + 1 })),
      providerId: "deepseek",
      model: 'deepseek-v4-pro',
      mode: 'agent' as WhaleMode,
      currentReasoningEffort: 'auto',
      prompt: null,
      setPrompt: (prompt: Prompt) => set({ prompt }),

      unavailable: false,
      threads: [],
      currentThreadId: null,
      currentTurnStatus: 'completed',
      turnStatusByThread: {},
      activeTurnId: null,
      activeApprovalId: null,
      pendingApprovals: {},
      events: {},
      deltaBuffers: {},
      streamingItems: {},
      toolCallEventsByItemId: {},

      setProvider: (providerId, model) => set({ providerId, model }),
      setModel: (model) => set({ model }),
      setMode: (mode) => set({ mode }),
      setReasoningEffort: (currentReasoningEffort) => set({ currentReasoningEffort }),

      setCurrentTurnStatus: (currentTurnStatus) => set({ currentTurnStatus }),
      setTurnStatusByThread: (threadId, status) => set((state) => ({ turnStatusByThread: { ...state.turnStatusByThread, [threadId]: status } })),
      setActiveTurnId: (activeTurnId) => set({ activeTurnId }),
      setActiveApprovalId: (activeApprovalId) => set({ activeApprovalId }),
      setUnavailable: (unavailable) => set({ unavailable }),
      setThreads: (threads) => set({ threads }),

      setCurrentThreadId: async (id) => {
        set({ currentThreadId: id });
      },

      addEvent: (threadId, event) =>
        set((state) => {
          const existing = state.events[threadId] ?? [];
          const seq = event.params.seq as number | undefined;
          if (seq !== undefined && existing.some((e) => (e.params.seq as number | undefined) === seq)) {
            return state;
          }
          return {
            events: {
              ...state.events,
              [threadId]: [...existing, event],
            },
          };
        }),

      appendDelta: (threadId, turnId, itemId, delta) => {
        const key = `${threadId}:${turnId}:${itemId}`;
        set((state) => ({
          deltaBuffers: {
            ...state.deltaBuffers,
            [key]: (state.deltaBuffers[key] ?? '') + delta,
          },
        }));
      },

      startStreamingItem: (threadId, turnId, itemId, kind) =>
        set((state) => ({
          streamingItems: {
            ...state.streamingItems,
            [threadId]: [
              ...(state.streamingItems[threadId] ?? []),
              { threadId, turnId, itemId, kind },
            ],
          },
        })),

      finishStreamingItem: (threadId, itemId) =>
        set((state) => ({
          streamingItems: {
            ...state.streamingItems,
            [threadId]: (state.streamingItems[threadId] ?? []).filter(
              (s) => s.itemId !== itemId,
            ),
          },
        })),

      setToolCallEventsByItemId: (itemId, inputEvent, outputEvent) =>
        set((state) => ({
          toolCallEventsByItemId: {
            ...state.toolCallEventsByItemId,
            [itemId]: {
              // Merge with existing entry so inputEvent and outputEvent
              // can be written separately (item.started / item.completed).
              ...state.toolCallEventsByItemId[itemId],
              ...(inputEvent !== undefined && { inputEvent }),
              ...(outputEvent !== undefined && { outputEvent }),
            },
          },
        })),

      addPendingApproval: (threadId, approval) =>
        set((state) => ({
          pendingApprovals: {
            ...state.pendingApprovals,
            [threadId]: [...(state.pendingApprovals[threadId] ?? []), approval],
          },
        })),
      clearPendingApprovals: (threadId) =>
        set((state) => ({
          pendingApprovals: {
            ...state.pendingApprovals,
            [threadId]: [],
          },
          activeApprovalId: null,
        })),

      decideApproval: async (approvalId, decision, remember) => {
        try {
          await invoke('decide_approval', {
            approvalId,
            decision,
            remember,
          });
          const threadId = get().currentThreadId;
          if (threadId) {
            set((state) => ({
              pendingApprovals: {
                ...state.pendingApprovals,
                [threadId]: (state.pendingApprovals[threadId] ?? []).filter(
                  (a) => a.id !== approvalId,
                ),
              },
              activeApprovalId:
                get().activeApprovalId === approvalId
                  ? null
                  : get().activeApprovalId,
            }));
          }
        } catch (err) {
          console.error('[whale] failed to decide approval:', err);
        }
      },
      usageByThread: {},
      setUsageByThread: (threadId, usage) => set((state) => ({
        usageByThread: {
          ...state.usageByThread,
          [threadId]: usage,
        },
      })),

      fileChangesByTurn: {},
      addFileChange: (threadId, turnId, change) => set((state) => {
        const existing = state.fileChangesByTurn[threadId]?.[turnId] ?? [];
        return {
          fileChangesByTurn: {
            ...state.fileChangesByTurn,
            [threadId]: {
              ...(state.fileChangesByTurn[threadId] ?? {}),
              [turnId]: [...existing, change],
            },
          },
        };
      }),
    }),
    {
      name: 'whale-store',
      partialize: (state) => ({
        providerId: state.providerId,
        model: state.model,
        mode: state.mode,
        prompt: state.prompt,
        currentReasoningEffort: state.currentReasoningEffort,
      }),
    },
  ),
);
