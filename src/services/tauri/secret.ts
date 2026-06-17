import { invoke } from '@tauri-apps/api/core';

export interface SecretsConfig {
  entries: Record<string, string>;
}

export async function loadSecrets() {
  const config: SecretsConfig = await invoke('read_secrets');
  return config;
}

export async function saveSecrets(newConfig: SecretsConfig) {
  await invoke('write_secrets', { config: newConfig });
}
