import {
  Blocks,
  ChevronDown,
  ChevronRight,
  Ellipsis,
  FolderClosed,
  FolderOpen,
  ListFilter,
  Settings,
  SquarePen,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThreadList } from './whale/ThreadList';
import { useWhaleStore, useWorkspaceStore } from '@/stores';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuAction,
} from '@/components/ui/sidebar';
import { useTranslation } from 'react-i18next';
import { ProjectSelector } from './ProjectSelector';
import { getFileName } from '@/lib/GetFileName';
import { useWhaleConnect } from '@/components/whale/hooks';
import { useLayoutStore } from '@/stores/useLayoutStore';

export function AppSidebar() {
  const { t } = useTranslation('sidebar');
  const {
    setCwd,
    workspaces,
    workspaceExpandedMap,
    toggleWorkspaceExpanded,
    removeWorkspace,
  } = useWorkspaceStore();
  const {
    setIsRightPanelOpen,
    setCurrentView } = useLayoutStore();
  const { setCurrentThreadId, triggerFocus } = useWhaleStore();
  useWhaleConnect();

  return (
    <Sidebar>
      <SidebarHeader data-tauri-drag-region>
        <SidebarTrigger className="ml-20" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="flex-1 overflow-y-auto min-h-0 px-2">

          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setCurrentThreadId(null);
                    setCurrentView('main');
                    setIsRightPanelOpen(false);
                    triggerFocus();
                  }}
                >
                  <SquarePen className="h-3.5 w-3.5" />
                  <span>{t('newChat')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setCurrentView('skills');
                  }}
                >
                  <Blocks className="h-3.5 w-3.5" />
                  <span>{t('skills')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>

          <SidebarGroupLabel className="group flex items-center justify-between mt-2 pt-0 h-7 px-2">
            <span>{t('projects')}</span>
            <span className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button size="icon" variant="ghost" className="h-5 w-5">
                <ListFilter />
              </Button>
              <ProjectSelector isIcon />
            </span>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {workspaces.map((ws) => {
                const isExpanded = workspaceExpandedMap[ws] ?? true;
                return (
                  <SidebarMenuItem key={ws} className="relative group/menu-item">
                    <SidebarMenuButton
                      onClick={() => toggleWorkspaceExpanded(ws)}
                      className="w-full justify-start gap-2 pr-14"
                    >
                      {isExpanded ? (
                        <FolderOpen className="h-4 w-4 shrink-0" />
                      ) : (
                        <FolderClosed className="h-4 w-4 shrink-0" />
                      )}
                      <span className="text-xs truncate font-semibold">{getFileName(ws)}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 shrink-0 ml-auto" />
                      ) : (
                        <ChevronRight className="h-3 w-3 shrink-0 ml-auto" />
                      )}
                    </SidebarMenuButton>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction showOnHover className="right-7">
                          <Ellipsis className="h-3.5 w-3.5" />
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive gap-2"
                          onClick={() => removeWorkspace(ws)}
                        >
                          <Trash2 className="h-4 w-4" />
                          {t('remove')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <SidebarMenuAction
                      showOnHover
                      className="right-1"
                      onClick={() => {
                        setCwd(ws);
                        setCurrentView('main');
                        triggerFocus();
                      }}
                    >
                      <SquarePen className="h-3.5 w-3.5" />
                    </SidebarMenuAction>

                    {isExpanded && (
                      <div className="border-muted mt-1">
                        <ThreadList workspace={ws} />
                      </div>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button
          className="w-full justify-start gap-2"
          onClick={() => setCurrentView('settings')}
          size="sm"
          variant="ghost"
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>{t('settings')}</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
