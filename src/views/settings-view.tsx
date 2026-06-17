import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings2 } from 'lucide-react';
import { useSettingsStore } from '@/stores';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { type } from '@tauri-apps/plugin-os';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLayoutStore } from '@/stores';

export default function SettingsView() {
  const { setCurrentView } = useLayoutStore();
  const { appLocale, setAppLocale } = useSettingsStore();
  const { t } = useTranslation("settings");
  const [isMac, setIsMac] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    try {
      const osType = type();
      setIsMac(osType === 'macos');
    } catch (e) { }
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      <header
        className={cn(
          "h-12 shrink-0 flex items-center z-50 transition-all",
          isMac && "pl-20",
          isMobile && "border-b px-4 justify-between"
        )}
        data-tauri-drag-region
      >
        {isMobile && (
          <div className="flex items-center gap-3 w-full">
            <Button
              onClick={() => setCurrentView('main')}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">{t('backToApp')}</span>
            </Button>
            <span className="font-semibold text-sm">General</span>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {!isMobile && (
          <aside className="w-64 border-r flex flex-col px-4 shrink-0">
            <Button
              onClick={() => setCurrentView('main')}
              variant="ghost"
              size="sm"
              className="justify-start gap-2 h-9 px-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('backToApp')}
            </Button>

            <nav className="flex flex-col gap-1">
              <Button
                variant="secondary"
                size="sm"
                className="justify-start gap-2 h-9 px-2"
              >
                <Settings2 className="h-4 w-4" />
                {t('general')}
              </Button>
            </nav>
          </aside>
        )}

        <main className="flex-1 overflow-y-auto bg-muted/20">
          <div className="max-w-3xl p-4 md:p-8 space-y-6 md:space-y-8">
            {!isMobile && (
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">{t('general')}</h1>
              </div>
            )}

            <div className="rounded-xl border bg-card shadow-sm divide-y">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 gap-4">
                <div className="flex items-center gap-4">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">{t('language')}</div>
                    <p className="text-xs text-muted-foreground">{t('app-ui-language')}</p>
                  </div>
                </div>

                <div className="w-full sm:w-[180px]">
                  <Select
                    value={appLocale}
                    onValueChange={(value: 'auto' | 'en' | 'zh') => setAppLocale(value)}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder={t('selectLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">{t('auto')}</SelectItem>
                      <SelectItem value="en">{t('english')}</SelectItem>
                      <SelectItem value="zh">{t('chinese')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}