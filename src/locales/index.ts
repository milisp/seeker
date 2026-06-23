import { en } from './en';
import { zh } from './zh';

export const localeResources = {
  en: { ...en },
  zh: { ...zh },
} as const;

export type AppLocale = keyof typeof localeResources;

export const localeLabels: Record<AppLocale, string> = {
  en: 'English',
  zh: '中文',
};
