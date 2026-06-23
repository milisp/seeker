import { ThreadListResponse, ThreadCreateParams, ThreadDetail, ThreadCreateResponse, ThreadInfo } from '@/components/whale/types';
import { useWhaleStore } from '@/stores';
import { invoke } from '@tauri-apps/api/core';
import { ListSkillsResponse, ToggleSkillResponse } from '@/services/types';

export function listThreads(): Promise<{ threads: ThreadListResponse[] }> {
  return invoke<{ threads: ThreadListResponse[] }>('list_threads');
}

export function CreateThread(
  params: ThreadCreateParams,
): Promise<{ thread: ThreadCreateResponse }> {
  return invoke<{ thread: ThreadCreateResponse }>(
    'create_thread',
    { params },
  );
}

export function sendPrompt(
  threadId: string,
  input: string,
  model: string,
  reasoningEffort?: string,
): Promise<void> {
  return invoke<void>('send_prompt', { threadId, input, model, reasoningEffort });
}

/** Get thread detail (provider / model / mode). */
export function getThread(threadId: string): Promise<ThreadDetail> {
  return invoke<ThreadDetail>('get_thread', { threadId });
}

export function turnInterrupt(): Promise<void> {
  const threadId = useWhaleStore().currentThreadId;
  const turnId = useWhaleStore().activeTurnId;
  console.debug('turn_interrupt', { threadId, turnId });
  return invoke<void>('turn_interrupt', { threadId, turnId });
}

export function resumeThread(threadId: string): Promise<ThreadInfo> {
  return invoke<ThreadInfo>('resume_thread', { threadId });
}

export function listSkills(): Promise<ListSkillsResponse> {
  return invoke<ListSkillsResponse>('list_skills');
}

export function toggleSkill(name: string, enabled: boolean): Promise<ToggleSkillResponse> {
  return invoke<ToggleSkillResponse>('toggle_skill', { name, enabled });
}

export function whaleConnect(provider: string): Promise<{ ok: boolean; provider: string; reused?: boolean }> {
  return invoke('connect', { provider });
}