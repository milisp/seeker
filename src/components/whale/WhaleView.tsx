import { useRef, useEffect, useState } from 'react';
import { AlertTriangle, ArrowDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWhaleEvents } from '@/components/whale/hooks';
import { useWhaleStore } from '@/components/whale/useWhaleStore';
import { Composer } from '@/components/whale/composer/Composer';
import { useSidebar } from '@/components/ui/sidebar';
import { useLayoutStore } from '@/stores';
import { ApprovalCard, StatusIndicator, EventItem } from '@/components/whale/cells';
import { WorkspacePopover } from '@/components/ProjectSelector';
import { Streamdown } from 'streamdown';
import { ContextWindow } from './composer/ContextWindow';
import { Button } from '@/components/ui/button';
import LogoSvg from '@/assets/seeker.svg';

export function WhaleView() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { open: sidebarOpen } = useSidebar();
  const { isRightPanelOpen } = useLayoutStore();

  const [showScrollButton, setShowScrollButton] = useState(false);
  const isAtBottomRef = useRef(true);

  useWhaleEvents();

  const {
    unavailable,
    currentThreadId,
    events,
    deltaBuffers,
    streamingItems,
    currentTurnStatus: status,
    pendingApprovals,
  } = useWhaleStore();

  const activeEvents = currentThreadId ? (events[currentThreadId] ?? []) : [];
  const activeApprovals = currentThreadId ? (pendingApprovals[currentThreadId] ?? []) : [];
  const activeStreamingItems = currentThreadId ? (streamingItems[currentThreadId] ?? []) : [];

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    scrollRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = () => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const { scrollTop, scrollHeight, clientHeight } = viewport;

    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    isAtBottomRef.current = isAtBottom;

    setShowScrollButton(!isAtBottom);
  };

  // Bind scroll listener directly to the Radix viewport element,
  // because onScroll on the ScrollArea root never fires.
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [scrollAreaRef.current]);

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [activeEvents.length, activeApprovals.length, status, deltaBuffers]);

  const bothOpen = sidebarOpen && isRightPanelOpen;
  const eitherOpen = sidebarOpen || isRightPanelOpen;
  const contentMaxW = bothOpen ? 'max-w-lg' : eitherOpen ? 'max-w-2xl' : 'max-w-4xl';
  const composerMaxW = contentMaxW;

  return (
    <div className="flex h-full w-full bg-background text-foreground overflow-hidden">
      <main className="flex-1 flex flex-col h-full relative">
        {unavailable && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-600 text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>runtime unavailable.</span>
          </div>
        )}

        <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
          <div className={`${contentMaxW} mx-auto space-y-6 ${!currentThreadId ? 'flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]' : 'p-4'}`}>
            <EventItem activeEvents={activeEvents} maxContentW={contentMaxW} />

            {activeStreamingItems.map(({ turnId, itemId }) => {
              const bufferKey = `${currentThreadId}:${turnId}:${itemId}`;
              const text = deltaBuffers[bufferKey] ?? '';
              if (!text) return null;
              return (
                <div key={itemId}>
                  <div className="whitespace-pre-wrap"><Streamdown mode="streaming">{text}</Streamdown></div>
                </div>
              );
            })}

            {activeApprovals.map(approval => (
              <ApprovalCard key={approval.id} approval={approval} />
            ))}

            <StatusIndicator />
            <div ref={scrollRef} className="h-px w-full" aria-hidden="true" />
          </div>
        </ScrollArea>

        {!currentThreadId ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center mb-8">
              <img src={LogoSvg} className="size-32" />
              <div className="text-2xl font-bold">Seeker</div>
            </div>
            <div className={`w-full ${composerMaxW} px-4 pointer-events-auto space-y-2`}>
              <Composer />
              <div className="flex gap-2 justify-between items-center">
                <WorkspacePopover />
                {currentThreadId && <ContextWindow />}
              </div>
            </div>
          </div>
        ) : (
          <div className={`relative ${composerMaxW} mx-auto w-full px-4 pb-2 space-y-2 z-10 bg-background`}>
            {showScrollButton && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2">
                <Button variant="secondary" size="icon" onClick={() => scrollToBottom('smooth')}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <Composer />
            <div className="flex gap-2 justify-between items-center">
              <WorkspacePopover />
              {currentThreadId && <ContextWindow />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}