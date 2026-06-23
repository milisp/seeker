import { PanelRight, Plus, Minimize2, Maximize2, FileDiff, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { FileView } from './features/files';
import { useLayoutStore } from '@/stores';
import { ReviewView } from './features/review/ReviewView';

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
  const { activeTab, setActiveTab } = useLayoutStore()

  const shouldShowTrigger = !open && isRightPanelMaximized;
  const needMacosSpacer = shouldShowTrigger;

  return (
    <div
      className="border-l flex flex-col h-full w-full overflow-hidden bg-background"
    >
      <div className="w-full h-full flex flex-col gap-0 overflow-hidden">
        <div
          className="flex items-center justify-between pt-1 px-2 border-b border-transparent shrink-0"
          data-tauri-drag-region
        >
          <div className="flex items-center gap-1">
            {needMacosSpacer && <div className="w-[72px] shrink-0" />}

            {shouldShowTrigger && (
              <SidebarTrigger />
            )}

            <div className="flex items-center gap-1 h-9">
              <Button
                size="sm"
                variant={activeTab === 'review' ? 'secondary' : 'ghost'}
                className="h-7 px-2 text-xs shadow-none"
                onClick={() => setActiveTab('review')}
              >
                <FileDiff /> Review
              </Button>
              <Button
                size="sm"
                variant={activeTab === 'file' ? 'secondary' : 'ghost'}
                className="h-7 px-2 text-xs shadow-none"
                onClick={() => setActiveTab('file')}
              >
                <File /> File
              </Button>
            </div>
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

        <div className="flex-1 overflow-auto">
          {activeTab === 'review' && (
            <ReviewView />
          )}
          {activeTab === 'file' && (
            <FileView />
          )}
        </div>
      </div>
    </div>
  );
}