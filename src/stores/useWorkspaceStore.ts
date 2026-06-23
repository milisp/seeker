import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CWD = string | null;
export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}
interface FileViewStore {
  selectedFilePath: string | null;
  setSelectedFilePath: (path: string | null) => void;
}

interface WorkspaceStore {
  cwd: CWD;
  setCwd: (cwd: CWD) => void;
  diffWordWrap: boolean;
  setDiffWordWrap: (val: boolean) => void;
  diffSplitMode: boolean;
  setDiffSplitMode: (val: boolean) => void;
  hasConfirmedGitRevert: boolean;
  setHasConfirmedGitRevert: (value: boolean) => void;
  workspaceExpandedMap: Record<string, boolean>;
  toggleWorkspaceExpanded: (cwd: string) => void;
  workspaces: string[];
  loadWorkspaces: () => Promise<void>;
  addWorkspace: (cwd: string) => Promise<void>;
  removeWorkspace: (cwd: string) => Promise<void>;

}

export const useWorkspaceStore = create<WorkspaceStore & ThemeState & FileViewStore>()(
  persist(
    (set) => ({
      cwd: null,
      setCwd: (cwd) => set({ cwd, selectedFilePath: null }),
      diffWordWrap: true,
      setDiffWordWrap: (val: boolean) => set({ diffWordWrap: val }),
      diffSplitMode: false,
      setDiffSplitMode: (val: boolean) => set({ diffSplitMode: val }),
      selectedFilePath: null,
      setSelectedFilePath: (path) => set({ selectedFilePath: path }),
      theme: 'system',
      setTheme: (theme: Theme) => set({ theme }),
      hasConfirmedGitRevert: false,
      setHasConfirmedGitRevert: (value) => set({ hasConfirmedGitRevert: value }),
      workspaceExpandedMap: {},
      toggleWorkspaceExpanded: (cwd: string) => set((state) => ({
        workspaceExpandedMap: {
          ...state.workspaceExpandedMap,
          [cwd]: !state.workspaceExpandedMap[cwd],
        },
      })),
      workspaces: [],
      loadWorkspaces: async () => {
        const workspaces = await invoke<string[]>('list_workspaces');
        set({ workspaces });
      },
      addWorkspace: async (cwd: string) => {
        const workspaces = await invoke<string[]>('add_workspace', { workspace: cwd });
        set({ workspaces });
      },
      removeWorkspace: async (cwd: string) => {
        const workspaces = await invoke<string[]>('remove_workspace', { workspace: cwd });
        set({ workspaces });
      },
    }),
    {
      name: 'workspace-store',
      partialize: (state) => ({
        cwd: state.cwd,
        theme: state.theme,
        diffWordWrap: state.diffWordWrap,
        diffSplitMode: state.diffSplitMode,
        hasConfirmedGitRevert: state.hasConfirmedGitRevert,
        workspaceExpandedMap: state.workspaceExpandedMap,
      }),
    }
  )
);

