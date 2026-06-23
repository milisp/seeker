import { useEffect } from 'react';
import { getCurrentWindow, PhysicalPosition } from '@tauri-apps/api/window';

export function useDevWindowPosition() {
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    async function moveWindowToTopLeft() {
      const appWindow = getCurrentWindow();
      await appWindow.setPosition(new PhysicalPosition(0, 100));
    }

    moveWindowToTopLeft();
  }, []);
}