import { useEffect, useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, Settings, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useWhaleStore, ReasoningEffort } from '@/components/whale/useWhaleStore';
import { WhaleProviderId } from '../types';
import { useTranslation } from 'react-i18next';
import { loadSecrets } from '@/services/tauri';
import { ApiKeyDialog } from './ApiKeyDialog';
import { ProviderIcons } from '@/components/ProviderIcons';

const REASONING_EFFORTS: { value: ReasoningEffort; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'off', label: 'Off' },
  { value: 'high', label: 'High' },
  { value: 'max', label: 'Max' },
];

type ProviderModel = {
  id: string;
  label: string;
};

type ProviderGroup = {
  id: string;
  label: string;
  models: ProviderModel[];
};

interface SecretsConfig {
  entries: Record<string, string>;
}

export function ModelSelect() {
  const { t } = useTranslation("chat");
  const { providerId, model, setProvider, currentReasoningEffort, setReasoningEffort } =
    useWhaleStore();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [groups, setGroups] = useState<ProviderGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [secrets, setSecrets] = useState<SecretsConfig>({ entries: {} });

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      return;
    }

    invoke<ProviderGroup[]>('list_models')
      .then((data) => {
        setGroups(data);
        return loadSecrets();
      })
      .then((config) => {
        if (config && config.entries) {
          setSecrets(config);
        }
      })
      .catch((e) => console.error('Failed to initialize content:', e));

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [open]);

  const currentGroup = groups.find((g) => g.id === providerId);
  const currentModelLabel =
    currentGroup?.models.find((m) => m.id === model)?.label ?? model;
  const currentProviderLabel = currentGroup?.label;

  const handleSelectModel = (pId: string, mId: string) => {
    setProvider(pId as WhaleProviderId, mId);
    setOpen(false);
  };

  const filteredGroups = groups
    .map((group) => {
      const filteredModels = group.models.filter((m) =>
        m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { ...group, models: filteredModels };
    })
    .filter((group) => group.models.length > 0);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2 border-0 shadow-none">
            {currentProviderLabel && providerId !== 'deepseek' && (
              <>
                <span className="font-medium text-muted-foreground">{currentProviderLabel}</span>
                <span className="text-muted-foreground/40">/</span>
              </>
            )}
            <span>{currentModelLabel}</span>
            <Badge variant="secondary">{currentReasoningEffort}</Badge>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="p-3 flex flex-col h-96 w-64 overflow-hidden gap-3"
          align="start"
        >
          <div className="flex shrink-0">
            <Input
              ref={inputRef}
              placeholder={t('searchModel')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 rounded-lg text-xs"
              autoFocus
            />
            <Button
              size='icon'
              variant='ghost'
              className="h-8 w-8"
              onClick={() => {
                setOpen(false);
                setSettingsOpen(true);
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 flex flex-col gap-0 overflow-y-auto pr-0.5">
            {filteredGroups.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                {groups.length === 0 ? 'Loading models…' : 'No models found'}
              </p>
            )}
            {filteredGroups.map((p) => {
              const hasKey = secrets.entries[p.id] && secrets.entries[p.id].trim() !== '';

              return (
                <div key={p.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between sticky top-0 bg-background z-10 py-0.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground/60">
                      <ProviderIcons providerId={p.id} size='sm' />{p.label}
                    </Label>
                    {!hasKey && p.id !== 'ollama' && (
                      <span className="text-[10px] text-amber-500 font-normal flex items-center gap-0.5">
                        <AlertCircle className="h-2.5 w-2.5" />
                        {t('common:missingKey')}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 pl-1">
                    {p.models.map((m) => {
                      const isSelected = providerId === p.id && model === m.id;
                      return (
                        <Button
                          key={m.id}
                          variant="ghost"
                          size="sm"
                          className={`w-full text-left flex items-center justify-between px-2 h-7 font-normal text-xs ${isSelected ? 'bg-primary text-primary-foreground' : ''}`}
                          onClick={() => handleSelectModel(p.id, m.id)}
                        >
                          <span className="truncate">{m.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-1 py-1 flex flex-col gap-1.5 shrink-0 bg-muted/10">
            <Label className="font-medium text-muted-foreground/70">{t('reasoning')}</Label>

            <div className="flex h-9 w-full items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
              {REASONING_EFFORTS.map((e) => {
                const isActive = currentReasoningEffort === e.value;
                return (
                  <button
                    key={e.value}
                    onClick={() => { setReasoningEffort(e.value); setOpen(false); }}
                    className={`
                      flex flex-1 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium
                      transition-all duration-200 select-none focus-visible:outline-none
                      ${isActive
                        ? 'bg-background text-foreground shadow-sm'
                        : 'hover:bg-background/50 hover:text-foreground'
                      }
                    `}
                  >
                    {t(e.value)}
                  </button>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <ApiKeyDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        groups={groups}
        secrets={secrets}
        onSaveSuccess={setSecrets}
      />
    </>
  );
}