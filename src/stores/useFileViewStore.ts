import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FileViewStore {
  selectedFilePath: string | null;
  setSelectedFilePath: (path: string | null) => void;
  hasConfirmedGitRevert: boolean;
  setHasConfirmedGitRevert: (value: boolean) => void;
}

export const useFileViewStore = create<FileViewStore>()(
  persist(
    (set) => ({
      selectedFilePath: null,
      setSelectedFilePath: (path) => set({ selectedFilePath: path }),
      hasConfirmedGitRevert: false,
      setHasConfirmedGitRevert: (value) => set({ hasConfirmedGitRevert: value }),
    }),
    {
      name: 'file-view-store',
      partialize: (state) => ({
        hasConfirmedGitRevert: state.hasConfirmedGitRevert,
      }),
    }
  )
);
