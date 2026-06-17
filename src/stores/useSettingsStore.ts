import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AppLocale = 'auto' | 'en' | 'zh';
export type Theme = 'light' | 'dark' | 'system';

interface SettingsStore {
  appLocale: AppLocale;
  setAppLocale: (locale: AppLocale) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      appLocale: 'auto',
      setAppLocale: (appLocale: AppLocale) => set({ appLocale }),

      theme: 'system',
      setTheme: (theme: Theme) => set({ theme }),
    }),
    {
      name: 'settings-store',
      partialize: (state) => ({
        appLocale: state.appLocale,
        theme: state.theme,
      }),
    }
  )
);
