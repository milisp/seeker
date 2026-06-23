import { useEffect } from 'react';
import { useWhaleStore } from '@/components/whale/useWhaleStore';
import { listen } from '@tauri-apps/api/event';
import { whaleConnect, listThreads } from '@/services/tauri';

export function useWhaleConnect() {
  const { setUnavailable, providerId, setThreads } = useWhaleStore();

  useEffect(() => {
    // Actively connect on mount so backend WhaleState has a client.
    whaleConnect(providerId).catch((err) => {
      console.error(`[whale] connect ${providerId} failed:`, err);
      setUnavailable(true);
    });

    const unlistens: Promise<() => void>[] = [];
    unlistens.push(
      listen<{ method: string }>('whale:connect', (event) => {
        const { method } = event.payload;

        switch (method) {
          case 'whale/connected':
            console.info('[whale] whale connected');
            setUnavailable(false);
            listThreads().then((res) => {
              setThreads(res.threads);
            });
            break;

          default:
            break;
        }
      })
    );

    return () => {
      Promise.all(unlistens).then((fns) => fns.forEach((fn) => fn()));
    };
  }, [setUnavailable, providerId]);
}
