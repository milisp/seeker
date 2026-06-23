import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { AppLocale, localeLabels, localeResources } from '@/locales';
import { locale } from '@tauri-apps/plugin-os';
import { useSettingsStore } from '@/stores';

const fallbackLocale: AppLocale = 'en';

/** Resolve the OS locale to a supported AppLocale, or null if unavailable. */
async function resolveOsLocale(): Promise<AppLocale | null> {
  try {
    const osLocale = await locale();
    if (!osLocale) return null;
    // Map Simplified Chinese variants (Hans) to 'zh'; otherwise use raw tag.
    const normalized = osLocale.includes('Hans') ? 'zh' : osLocale;
    return (normalized as AppLocale) in localeResources
      ? (normalized as AppLocale)
      : null;
  } catch (error) {
    console.error('Failed to get OS locale:', error);
    return null;
  }
}

/** Determine the initial language: honor explicit setting, auto-detect, or fallback. */
async function resolveInitialLocale(): Promise<AppLocale> {
  const stored = useSettingsStore.getState().appLocale;
  if (stored !== 'auto') return stored as AppLocale;

  const osLocale = await resolveOsLocale();
  console.log('OS locale resolved:', osLocale);
  return osLocale ?? fallbackLocale;
}

const initialLocale = await resolveInitialLocale();

if (!i18n.isInitialized) {
  await i18n.use(initReactI18next).init({
    resources: localeResources,
    lng: initialLocale,
    fallbackLng: fallbackLocale,
    interpolation: {
      escapeValue: false,
    },
  });
}

// Keep i18next in sync whenever the persisted locale changes.
useSettingsStore.subscribe((state) => {
  const lang = state.appLocale === 'auto' ? fallbackLocale : (state.appLocale as AppLocale);
  if (i18n.language !== lang) {
    void i18n.changeLanguage(lang);
  }
});

export { i18n };

export const supportedLocales = (Object.keys(localeResources) as AppLocale[]).map((code) => ({
  code,
  label: localeLabels[code],
}));
