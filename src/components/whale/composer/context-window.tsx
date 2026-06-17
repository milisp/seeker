import { useWhaleStore } from '@/components/whale/use-whale-store';
import { Activity } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

function formatTokens(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

export function ContextWindow() {
  const { usageByThread, currentThreadId } = useWhaleStore();

  const usage = currentThreadId ? usageByThread[currentThreadId] : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Activity className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" align="end">
        {usage ? (
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Input:</span>
              <span className="font-medium font-mono" title={usage.input_tokens.toLocaleString()}>
                {formatTokens(usage.input_tokens)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Output:</span>
              <span className="font-medium font-mono" title={usage.output_tokens.toLocaleString()}>
                {formatTokens(usage.output_tokens)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            No usage data available
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}