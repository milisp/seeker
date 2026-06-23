import { open } from '@tauri-apps/plugin-dialog';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { Button } from '@/components/ui/button';
import { Folder, FolderPlus } from 'lucide-react';
import { getFileName } from '@/lib/GetFileName';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

type Props = {
  isIcon?: boolean;
}

export function ProjectSelector({ isIcon = false }: Props) {
  const { cwd, setCwd, addWorkspace } = useWorkspaceStore();

  async function selectCwd() {
    try {
      const projectPath = await open({
        directory: true,
        multiple: false,
      });

      if (!projectPath) {
        return;
      }
      setCwd(projectPath);
      await addWorkspace(projectPath);
    } catch (e) {
      console.error('Failed to select working directory:', e);
    }
  }

  if (isIcon) {
    return (
      <Button variant="ghost" onClick={selectCwd} size="icon" className='h-6 w-6'>
        <FolderPlus className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Button onClick={selectCwd} className="sm">
      <Folder className="w-4 h-4" />
      <span className="truncate">{cwd ? getFileName(cwd) : 'Working in a folder'}</span>
    </Button>
  );
}

export function WorkspacePopover() {
  const { t } = useTranslation('common')
  const { cwd, setCwd, addWorkspace, workspaces } = useWorkspaceStore();
  const [isOpen, setIsOpen] = useState(false)


  async function selectCwd() {
    try {
      const projectPath = await open({
        directory: true,
        multiple: false,
      });

      if (!projectPath) {
        return;
      }
      setCwd(projectPath);
      await addWorkspace(projectPath);
    } catch (e) {
      console.error('Failed to select working directory:', e);
    } finally {
      setIsOpen(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <FolderPlus className="w-4 h-4" /> {cwd ? getFileName(cwd) : t("workingInAProject")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-fit p-1 gap-1'>
        {workspaces.map((ws) => (
          <Button key={ws} onClick={() => { setCwd(ws); setIsOpen(false) }} variant="ghost" className='w-full justify-start'>
            <Folder className="w-4 h-4" />
            <span className="truncate">{getFileName(ws)}</span>
          </Button>
        ))}
        <Separator />
        <Button variant="ghost" onClick={selectCwd} className='w-full justify-start'>
          <FolderPlus className="w-4 h-4" /> {t('addProject')}
        </Button>
      </PopoverContent>
    </Popover>
  );
}