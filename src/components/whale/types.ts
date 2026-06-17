export type WhaleProviderId = string;
export type ThreadEvent = 'thread.started'
export type TurnEvent = 'turn.started' | 'turn.lifecycle' | 'turn.completed' | 'turn.interrupt_requested'
export type ItemEvent = 'item.started' | 'item.delta' | 'item.completed' | 'item.failed' | 'item.interrupted';
export type ApprovalEvent = 'approval.required' | 'approval.decided' | 'approval.timeout';
export type EventType = ThreadEvent | TurnEvent | ItemEvent | ApprovalEvent;

export type ItemKind = 'user_message' | 'agent_message' | 'tool_call' | 'error' | 'file_change' | 'status' | 'command_execution';
export type ThreadStatus = 'running' | 'completed' | 'failed' | 'paused' | 'archived' | 'idle';
export type TurnStatus = 'in_progress' | 'completed' | 'failed' | 'interrupted';

export interface ThreadInfo {
  id: string;
  model: string;
  workspace: string;
  mode: string;
  allow_shell: boolean;
  archived: boolean;
  auto_approve: boolean;
  coherence_state: string;
  trust_mode: boolean;
  created_at: string;
  updated_at: string;
  latest_turn_id?: string
}

export interface ItemInfo {
  id: string;
  turn_id: string;
  kind: ItemKind;
  status: TurnStatus;
  summary: string;
  detail: string;
  started_at: string;
  ended_at: string;
  artifact_refs: any[];
}

export type Usage = {
  input_tokens: number;
  output_tokens: number;
}

export interface TurnInfo {
  id: string;
  thread_id: string;
  status: TurnStatus;
  input_summary: string;
  item_ids: string[];
  steer_count: number;
  created_at: string;
  started_at: string;
  ended_at?: string;
  duration_ms?: number;
  error?: string;
  usage?: Usage;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ApprovalPayload {
  approval_id: string
  description: string
  id: string
  intent_summary: string
  tool_name: string
}

export interface ApprovalDecidedPayload {
  approval_id: string
  decision: string
  remember: boolean
}

export interface AgentLogEvent {
  event: EventType;
  seq: number;
  created_at: string;
  timestamp: string;
  thread_id: string;
  turn_id: string | null;
  item_id: string | null;
  thread?: ThreadInfo;
  turn?: TurnInfo;
  item?: ItemInfo;
  payload?: {
    thread?: ThreadInfo;
    turn?: TurnInfo;
    item?: ItemInfo;
    delta?: string;
    kind?: ItemKind
    tool?: ToolCall
  };
}

export interface WhaleEvent {
  method: string;
  params: AgentLogEvent
}

export type WhaleMode = 'agent' | 'plan' | 'yolo';

export interface ThreadDetail {
  provider?: string;
  model?: string;
  mode?: string;
}

export interface ThreadCreateParams {
  workspace: string;
  model: string;
  mode: string;
  allow_shell: boolean;
  trust_mode: boolean;
  auto_approve: boolean;
}

export interface ThreadCreateResponse {
  id: string;
  created_at: string;
  updated_at: string;
  model: string;
  workspace: string;
  mode: string;
  allow_shell: boolean;
  trust_mode: boolean;
  auto_approve: boolean;
  archived: boolean;
  coherence_state: string;
}

export interface ThreadListResponse {
  id: string;
  title: string;
  preview: string;
  model: string;
  mode: string;
  workspace: string;
  branch: string;
  head: string;
  dirty: boolean;
  archived: boolean;
  updated_at: string;
  latest_turn_id: string;
  latest_turn_status: string;
}
