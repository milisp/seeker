import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Key } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { loadSecrets } from '@/services/tauri';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: ProviderGroup[];
  secrets: SecretsConfig;
  onSaveSuccess: (config: SecretsConfig) => void;
}

const API_KEY_URLS: Record<string, string> = {
  deepseek: 'https://platform.deepseek.com/api_keys',
  atlascloud: 'https://www.atlascloud.ai/console/api-keys',
  openrouter: 'https://openrouter.ai/keys',
  'nvidia-nim': 'https://build.nvidia.com/deepseek-ai/deepseek-v4-flash',
};

const providerSignupLink: Record<string, string> = {
  atlascloud: 'https://www.atlascloud.ai?ref=FRZY3G',
  'nvidia-nim': 'https://build.nvidia.com/?modal=signin&utm_medium=organic&utm_campaign=seeker',
  openrouter: 'https://openrouter.ai',
  deepseek: 'https://platform.deepseek.com/sign_in',
};

export function ApiKeyDialog({
  open,
  onOpenChange,
  groups,
  secrets,
  onSaveSuccess,
}: ApiKeyDialogProps) {
  const { t } = useTranslation(["chat", "common"]);
  const [formKeys, setFormKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const currentFormKeys: Record<string, string> = {};
      groups.forEach((g) => {
        currentFormKeys[g.id] = secrets.entries[g.id] || '';
      });
      setFormKeys(currentFormKeys);
    }
  }, [open, groups, secrets]);

  const handleSaveKeys = async () => {
    try {
      const updatedEntries = { ...secrets.entries, ...formKeys };
      await invoke('write_secrets', { config: { entries: updatedEntries } });
      onOpenChange(false);

      const config = await loadSecrets();
      if (config && config.entries) {
        onSaveSuccess(config);
      }
    } catch (e) {
      console.error('Failed to save secrets:', e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium flex items-center gap-2">
            <Key className="h-4 w-4" />
            {t('common:apiKeySettings')}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {groups.map((g) => (
            <>
              {g.id !== 'ollama' && (
                <div key={g.id} className="gap-2">
                  <div className="flex justify-between items-center gap-2">
                    <Label htmlFor={g.id} className="text-muted-foreground">{g.label}</Label>
                    <span className='flex items-center'>
                      {providerSignupLink[g.id] && (
                        <Button size="xs" variant="ghost"
                          onClick={() => openUrl(providerSignupLink[g.id])}
                        >
                          <ExternalLink className="h-3 w-3" />
                          {t('common:signup')}
                        </Button>
                      )}
                      {API_KEY_URLS[g.id] && (
                        <Button size="xs" variant="ghost"
                          onClick={() => openUrl(API_KEY_URLS[g.id])}
                        >
                          <ExternalLink className="h-3 w-3" />
                          {t('common:getApiKey')}
                        </Button>
                      )}
                    </span>
                  </div>
                  <Input
                    id={g.id}
                    type="password"
                    value={formKeys[g.id] || ''}
                    onChange={(e) => setFormKeys({ ...formKeys, [g.id]: e.target.value })}
                    placeholder={`Enter ${g.label} key...`}
                    className="h-8 rounded-lg text-xs"
                  />
                </div>
              )}
            </>
          ))}
        </div>
        <DialogFooter>
          <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)} className="h-8 text-xs">
            {t("common:cancel")}
          </Button>
          <Button size="sm" onClick={handleSaveKeys} className="h-8 text-xs">
            {t("common:save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
