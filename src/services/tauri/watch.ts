import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface FsChange {
  path: string;
  kind: "create" | "modify" | "remove" | "access" | "other" | "any";
  is_dir: boolean;
}

export function startWatch(path: string): Promise<void> {
  return invoke("start_watch", { path });
}

export function stopWatch(path: string): Promise<void> {
  return invoke("stop_watch", { path });
}

export function onFsChange(handler: (change: FsChange) => void): Promise<UnlistenFn> {
  return listen<FsChange>("fs_change", (e) => handler(e.payload));
}
