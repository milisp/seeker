import { invoke } from '@tauri-apps/api/core';

export const workspaceService = {
  async load(): Promise<string[]> {
    return await invoke('load_workspaces');
  },
  async add(workspace: string): Promise<string[]> {
    return await invoke('add_workspace', { workspace });
  },
  async remove(workspace: string): Promise<string[]> {
    return await invoke('remove_workspace', { workspace });
  },
};
