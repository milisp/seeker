import { useEffect, useRef, useState } from 'react';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { onFsChange } from '@/services/tauri/watch';
import MDEditor from '@uiw/react-md-editor';
import { useThemeContext } from '@/components/ThemeContext';
import { Folders } from 'lucide-react';
import { useFileViewStore, useWorkspaceStore } from '@/stores';
import { FileTree, type FileTreeHandle } from './FileTree';
import { Button } from '@/components/ui/button';
import { OfficeView } from './OfficeView';

export function FileView() {
  const { selectedFilePath } = useFileViewStore();
  const { resolvedTheme } = useThemeContext();
  const [content, setContent] = useState<string>('');
  const { cwd } = useWorkspaceStore();
  const [isFileTreeOpen, setIsFileTreeOpen] = useState(true);
  const fileTreeRef = useRef<FileTreeHandle>(null);

  useEffect(() => {
    if (selectedFilePath) {
      const ext = selectedFilePath.split(/[\\/]/).pop()?.split('.').pop()?.toLowerCase() || '';
      if (['docx', 'pptx', 'xlsx', 'xls', 'doc', 'pdf'].includes(ext)) {
        return;
      }
      readTextFile(selectedFilePath).then(setContent).catch(console.error);
    } else {
      setContent('');
    }
  }, [selectedFilePath]);

  useEffect(() => {
    if (!selectedFilePath) return;
    const ext = selectedFilePath.split(/[\\/]/).pop()?.split('.').pop()?.toLowerCase() || '';
    if (['docx', 'pptx', 'xlsx', 'xls', 'doc', 'pdf'].includes(ext)) return;

    let unlisten: (() => void) | undefined;
    onFsChange((change) => {
      if (change.path === selectedFilePath) {
        readTextFile(selectedFilePath).then(setContent).catch(console.error);
      }
    }).then((fn) => { unlisten = fn; });
    return () => { unlisten?.(); };
  }, [selectedFilePath]);

  if (!cwd) return null;

  const isMarkdown = selectedFilePath?.toLowerCase().endsWith('.md') ?? false;
  const currentFolder = cwd.split(/[/\\]/).pop();
  const selectedFile = selectedFilePath?.split(/[/\\]/).pop();
  const extension = selectedFilePath?.split(/[\\/]/).pop()?.split('.').pop()?.toLowerCase() || '';

  return (
    <div className="flex h-full w-full overflow-hidden" data-color-mode={resolvedTheme}>
      <div className="flex-1 h-full flex flex-col min-w-0">
        <div className="flex justify-between items-center px-2 border-b">
          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
            {currentFolder}
            {selectedFile && (
              <>
                <span className="text-gray-400 font-light">&gt;</span>
                <span className="text-foreground font-medium truncate">
                  {selectedFile}
                </span>
              </>
            )}
          </div>
          <Button
            onClick={() => {
              setIsFileTreeOpen((prev) => {
                if (!prev) setTimeout(() => fileTreeRef.current?.focusSearch(), 0);
                return !prev;
              });
            }}
            variant={isFileTreeOpen ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
          >
            <Folders size={18} />
          </Button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="h-full flex-1 overflow-auto min-h-0">
            {selectedFilePath ? (
              isMarkdown ? (
                <MDEditor.Markdown
                  source={content}
                  style={{ padding: '20px', backgroundColor: 'transparent' }}
                />
              ) : ['docx', 'pptx', 'xlsx', 'xls', 'doc', 'pdf'].includes(extension) ? (
                <OfficeView />
              ) : (
                <pre className="p-4 whitespace-pre-wrap font-mono text-sm text-foreground">
                  {content}
                </pre>
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
                Select a file to view
              </div>
            )}
          </div>

          {isFileTreeOpen && (
            <div className="w-60 h-full border-l">
              <FileTree ref={fileTreeRef} folder={cwd} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}