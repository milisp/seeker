import { invoke } from '@tauri-apps/api/core';
import { resolve } from '@tauri-apps/api/path';
import type { FileNode } from './types';

export async function listDir(dir: string): Promise<FileNode[]> {
  try {
    return await invoke<FileNode[]>('list_dir', { path: await resolve(dir) });
  } catch (err) {
    console.warn('Failed to read directory', dir, err);
    return [];
  }
}
