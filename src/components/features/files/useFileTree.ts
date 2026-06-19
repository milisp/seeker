import { useCallback, useEffect, useState } from 'react';
import { basename, dirname, resolve } from '@tauri-apps/api/path';
import { onFsChange, startWatch, stopWatch } from '@/services/tauri/watch';
import type { FileNode } from './types';
import { listDir } from './fs';

function updateChildren(node: FileNode, targetPath: string, children: FileNode[]): FileNode {
  if (node.path === targetPath) return { ...node, children };
  if (!node.children) return node;
  return { ...node, children: node.children.map((c) => updateChildren(c, targetPath, children)) };
}

export interface UseFileTreeResult {
  root: FileNode | null;
  loading: boolean;
  error: string | null;
  loadChildren: (node: FileNode) => Promise<void>;
  refreshDir: (dirPath: string) => Promise<void>;
}

export function useFileTree(folder: string): UseFileTreeResult {
  const [root, setRoot] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const resolvedFolder = await resolve(folder);
        const [label, children] = await Promise.all([
          basename(resolvedFolder),
          listDir(resolvedFolder),
        ]);
        if (active) {
          setRoot({ name: label || folder, path: resolvedFolder, kind: 'dir', children });
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to read folder.');
          setRoot(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    if (folder) load();
    else { setRoot(null); }
    return () => { active = false; };
  }, [folder]);

  const refreshDir = useCallback(async (dirPath: string) => {
    try {
      const normalizedPath = await resolve(dirPath);
      const children = await listDir(normalizedPath);
      setRoot((prev) => prev ? updateChildren(prev, normalizedPath, children) : prev);
    } catch (err) {
      console.warn('Failed to refresh directory', dirPath, err);
    }
  }, []);

  const loadChildren = useCallback(async (node: FileNode) => {
    if (node.kind !== 'dir' || node.children) return;
    try {
      const children = await listDir(node.path);
      setRoot((prev) => prev ? updateChildren(prev, node.path, children) : prev);
    } catch (err) {
      console.warn('Failed to load children', node.path, err);
    }
  }, []);

  // Watch folder for fs changes
  useEffect(() => {
    if (!folder) return;
    let unlisten: (() => void) | undefined;
    const setup = async () => {
      const watchedPath = await resolve(folder);
      await startWatch(watchedPath);
      unlisten = await onFsChange(async (change) => {
        const changedDir = await dirname(change.path);
        void refreshDir(changedDir);
      });
    };
    void setup();
    return () => {
      void resolve(folder).then(stopWatch);
      unlisten?.();
    };
  }, [folder, refreshDir]);

  return { root, loading, error, loadChildren, refreshDir };
}
