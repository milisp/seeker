import { create } from 'zustand';

type TabValue = 'review' | 'file';

interface LayoutStore {
  currentView: string;
  setCurrentView: (view: string) => void;
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (val: boolean) => void;
  activeTab: TabValue;
  setActiveTab: (tab: TabValue) => void;
}

export const useLayoutStore = create<LayoutStore>()(
  (set) => ({
    currentView: 'main',
    setCurrentView: (view) => set({ currentView: view }),
    isRightPanelOpen: false,
    setIsRightPanelOpen: (val: boolean) => set({ isRightPanelOpen: val }),
    activeTab: 'review',
    setActiveTab: (tab) => set({ activeTab: tab }),
  })
);