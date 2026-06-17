import { useState, useEffect } from 'react';
import { PanelRight, SquarePen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { usePanelRef } from 'react-resizable-panels';
import { RightPanel } from '@/components/right-panel';
import { AppSidebar } from '@/components/app-sidebar';
import { WhaleView } from '@/components/whale/whale-view';
import { useWhaleStore, useLayoutStore } from '@/stores';
import SkillsView from '@/views/skills-view';
import SettingsView from '@/views/settings-view';
import { listen } from '@tauri-apps/api/event';

export default function Layout() {
  const { currentView, setCurrentView, isRightPanelOpen, setIsRightPanelOpen } = useLayoutStore();
  const [isRightPanelMaximized, setIsRightPanelMaximized] = useState(false);
  const [open, setOpen] = useState(false);
  const { setCurrentThreadId, triggerFocus } = useWhaleStore();

  useEffect(() => {
    const unlisten = listen('trigger-open-settings', () => {
      setCurrentView('settings');
    });

    return () => {
      unlisten.then(f => f());
    };
  }, [setCurrentView]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setCurrentThreadId(null);
        setCurrentView('main');
        triggerFocus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showSidebar = currentView !== 'settings';
  const showRightPanel = currentView === 'main' && isRightPanelOpen;

  // Resize main panel imperatively when right panel mounts/unmounts
  const mainPanelRef = usePanelRef();
  useEffect(() => {
    // Wait one tick for the new panel to mount before resizing
    const id = setTimeout(() => {
      mainPanelRef.current?.resize(showRightPanel ? '65%' : '100%');
    }, 0);
    return () => clearTimeout(id);
  }, [showRightPanel]);

  // When maximized: sidebar + full RightPanel only
  if (isRightPanelMaximized && showRightPanel) {
    return (
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <div className="flex h-screen w-screen overflow-hidden">
          {showSidebar && <AppSidebar />}
          <RightPanel
            isRightPanelMaximized={isRightPanelMaximized}
            setIsRightPanelMaximized={setIsRightPanelMaximized}
            setIsRightPanelOpen={setIsRightPanelOpen}
          />
        </div>
      </SidebarProvider>
    );
  }

  // Settings view takes over the full layout
  if (currentView === 'settings') {
    return <SettingsView />;
  }

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className="flex h-screen w-screen overflow-hidden">
        {showSidebar && <AppSidebar />}

        <ResizablePanelGroup
          orientation="horizontal"
          className="flex-1 min-w-0 overflow-hidden"
        >
          {/* Primary panel */}
          <ResizablePanel panelRef={mainPanelRef} defaultSize="65%" minSize="30%">
            <div className="flex flex-col h-full overflow-hidden bg-background border-l">
              <header
                className="flex h-12 items-center justify-between px-2 shrink-0"
                data-tauri-drag-region
              >
                <div className="flex items-center gap-2">
                  {!open && (
                    <>
                      <SidebarTrigger className='ml-20' />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentThreadId(null);
                          setCurrentView('main');
                          triggerFocus();
                        }}
                      >
                        <SquarePen className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>

                {currentView === 'main' && !isRightPanelOpen && (
                  <Button onClick={() => setIsRightPanelOpen(true)} size="icon" variant="ghost">
                    <PanelRight className="h-5 w-5" />
                  </Button>
                )}
              </header>

              <main className="flex-1 overflow-hidden flex flex-col">
                {currentView === 'main' && <WhaleView />}
                {currentView === 'skills' && <SkillsView />}
              </main>
            </div>
          </ResizablePanel>

          {/* Right panel — conditionally rendered, fills remaining space */}
          {showRightPanel && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="35%" minSize="20%" maxSize="60%">
                <RightPanel
                  isRightPanelMaximized={isRightPanelMaximized}
                  setIsRightPanelMaximized={setIsRightPanelMaximized}
                  setIsRightPanelOpen={setIsRightPanelOpen}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </SidebarProvider>
  );
}
