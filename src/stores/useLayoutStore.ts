import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutStore {
  currentView: string;
  setCurrentView: (view: string) => void;
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (val: boolean) => void;
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      currentView: 'main',
      setCurrentView: (view) => set({ currentView: view }),
      isRightPanelOpen: false,
      setIsRightPanelOpen: (val: boolean) => set({ isRightPanelOpen: val }),
    }),
    {
      name: 'layout-store',
      partialize: (state) => ({
        currentView: state.currentView,
        isRightPanelOpen: state.isRightPanelOpen,
      }),
    }
  )
);