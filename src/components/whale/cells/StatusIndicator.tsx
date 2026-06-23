import { Sparkles } from 'lucide-react';
import { useWhaleStore } from '@/components/whale/useWhaleStore';

export function StatusIndicator() {
  const { currentTurnStatus: status } = useWhaleStore();

  if (status === 'in_progress') {
    return (
      <div
        className="flex items-center gap-2 px-4 py-2 border border-border bg-card/65 rounded-lg backdrop-blur-sm w-fit mt-4 text-amber-500 text-xs"
      >
        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
        <span>Working…</span>
      </div>
    );
  }

  return null;
}