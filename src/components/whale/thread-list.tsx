import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { resumeThread } from '@/services/tauri';
import { WhaleMode, type ThreadListResponse } from '@/components/whale/types';
import { useWhaleStore } from '@/components/whale/use-whale-store';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { BaseDirectory, remove } from "@tauri-apps/plugin-fs";
import { useLayoutStore, useWorkspaceStore } from '@/stores';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from 'react-i18next';

interface ThreadListProps {
  workspace: string;
}

export function ThreadList({ workspace }: ThreadListProps) {
  const { t } = useTranslation("common");
  const { setCwd } = useWorkspaceStore()
  const { setCurrentView } = useLayoutStore()
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [deleteThreadId, setDeleteThreadId] = useState<string | null>(null);
  const {
    threads,
    currentThreadId,
    turnStatusByThread,
    setThreads,
    setCurrentThreadId,
    clearPendingApprovals,
    setModel,
    setMode,
  } = useWhaleStore();

  async function handleResume(thread: ThreadListResponse) {
    if (resumingId) return;
    setResumingId(thread.id);
    const previousThreadId = currentThreadId;
    try {
      await setCurrentThreadId(thread.id);
      clearPendingApprovals(thread.id);
      const res = await resumeThread(thread.id);
      setModel(res.model);
      setMode(res.mode as WhaleMode);
      setCwd(res.workspace);
      setCurrentView('main');
    } catch (error) {
      await setCurrentThreadId(previousThreadId);
      console.error('Failed to resume thread:', error);
    } finally {
      setResumingId(null);
    }
  }

  const executeDelete = async (threadId: string) => {
    try {
      await remove(`.codewhale/tasks/runtime/events/${threadId}.jsonl`, { baseDir: BaseDirectory.Home });
      await remove(`.codewhale/tasks/runtime/threads/${threadId}.json`, { baseDir: BaseDirectory.Home });
      console.log(`Thread ${threadId} deleted`);
      setThreads(threads.filter((t) => t.id !== threadId));
      if (currentThreadId === threadId) {
        setCurrentThreadId(null);
      }
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  };

  const handleThreadContextMenu = async (event: React.MouseEvent, threadId: string) => {
    event.preventDefault();
    const menu = await Menu.new({
      items: [
        await MenuItem.new({
          text: 'Copy Thread ID',
          action: async () => {
            navigator.clipboard.writeText(threadId);
          },
        }),
        await MenuItem.new({
          text: 'Delete Thread',
          action: async () => {
            setDeleteThreadId(threadId);
          },
        }),
      ],
    });
    await menu.popup();
  };

  const filteredThreads = threads.filter((t) => t.workspace === workspace);

  return (
    <>
      <ScrollArea>
        <div className="flex flex-col gap-1 pr-3">
          {filteredThreads.map((thread) => (
            <Button
              key={thread.id}
              variant="ghost"
              className={`w-full justify-start gap-2 text-sm font-normal truncate ${currentThreadId === thread.id ? 'bg-accent' : ''
                }`}
              onClick={() => handleResume(thread)}
              onContextMenu={(event) => handleThreadContextMenu(event, thread.id)}
            >
              <span className="shrink-0 w-3 flex items-center justify-center">
                {turnStatusByThread[thread.id] === 'in_progress' && (
                  <Loader2 className="size-3 animate-spin text-muted-foreground" />
                )}
              </span>
              <span className="truncate">
                {thread.title}
              </span>
            </Button>
          ))}
        </div>
      </ScrollArea>

      <AlertDialog open={!!deleteThreadId} onOpenChange={(open) => !open && setDeleteThreadId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDeleteThread")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteThreadId) {
                  executeDelete(deleteThreadId);
                }
              }}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}