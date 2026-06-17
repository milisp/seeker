import { invoke } from "@tauri-apps/api/core";

export function startWatch(path: string): Promise<void> {
  return invoke("start_watch", { path });
}

export function stopWatch(path: string): Promise<void> {
  return invoke("stop_watch", { path });
}
