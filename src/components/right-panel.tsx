import { PanelRight, Plus, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

interface RightPanelProps {
  isRightPanelMaximized: boolean;
  setIsRightPanelMaximized: (val: boolean) => void;
  setIsRightPanelOpen: (val: boolean) => void;
}

export function RightPanel({
  isRightPanelMaximized,
  setIsRightPanelMaximized,
  setIsRightPanelOpen,
}: RightPanelProps) {
  const { open } = useSidebar();

  const shouldShowTrigger = !open && isRightPanelMaximized;
  const needMacosSpacer = shouldShowTrigger;

  return (
    <div
      className="border-l flex flex-col h-full w-full overflow-hidden bg-background"
    >
      <div
        className="flex items-center justify-between pt-1 px-2 border-b border-transparent shrink-0"
        data-tauri-drag-region
      >
        <div className="flex items-center">
          {needMacosSpacer && <div className="w-[72px] shrink-0" />}

          {shouldShowTrigger && (
            <SidebarTrigger />
          )}

        </div>

        <div className="flex items-center">
          <Button size="icon" variant="ghost">
            <Plus />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsRightPanelMaximized(!isRightPanelMaximized)}
          >
            {isRightPanelMaximized ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setIsRightPanelOpen(false);
              setIsRightPanelMaximized(false);
            }}
          >
            <PanelRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}