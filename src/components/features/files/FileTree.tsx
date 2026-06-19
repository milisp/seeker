import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { FileIcon, defaultStyles } from 'react-file-icon';
import { invoke } from '@tauri-apps/api/core';
import { resolve } from '@tauri-apps/api/path';
import { ChevronDown, ChevronRight, Plus, Search, X } from 'lucide-react';
import { useWhaleStore, useFileViewStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FileNode, SearchResult, FileTreeProps } from './types';
import { buildSearchTree, getExtension } from './utils';
import { useFileTree } from './useFileTree';

export interface FileTreeHandle {
  focusSearch: () => void;
}

export const FileTree = forwardRef<FileTreeHandle, FileTreeProps>(function FileTree({ folder, onFileSelect }, ref) {
  const { root, loading, error, loadChildren } = useFileTree(folder);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchAbortRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focusSearch: () => searchInputRef.current?.focus(),
  }));

  const { setSelectedFilePath } = useFileViewStore();
  const { setPrompt, prompt, triggerFocus } = useWhaleStore();

  const isSearchMode = searchQuery.trim().length > 0;

  // Expand root when it first loads
  useEffect(() => {
    if (root?.path) setExpanded(new Set([root.path]));
  }, [root?.path]);

  // Re-focus search input after root finishes loading (async load steals focus)
  useEffect(() => {
    if (!root || loading) return;
    const el = searchInputRef.current;
    if (el && document.activeElement !== el) el.focus();
  }, [root, loading]);

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (searchAbortRef.current) clearTimeout(searchAbortRef.current);
    const q = searchQuery.trim();
    if (!q) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    searchAbortRef.current = setTimeout(async () => {
      try {
        const results = await invoke<SearchResult[]>('search_dir', { root: await resolve(folder), query: q, limit: 200 });
        setSearchResults(results);
      } catch (err) {
        console.warn('search_dir failed', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => { if (searchAbortRef.current) clearTimeout(searchAbortRef.current); };
  }, [searchQuery, folder]);

  const searchTree = useMemo(
    () => (root && searchResults.length > 0) ? buildSearchTree(searchResults, root.path) : [],
    [searchResults, root?.path],
  );

  // Auto-expand all dir nodes produced by buildSearchTree
  useEffect(() => {
    if (!isSearchMode || searchTree.length === 0) return;
    const dirPaths = new Set<string>();
    const collectDirs = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.kind === 'dir') {
          dirPaths.add(node.path);
          if (node.children) collectDirs(node.children);
        }
      }
    };
    collectDirs(searchTree);
    if (dirPaths.size > 0) setExpanded((prev) => new Set([...prev, ...dirPaths]));
  }, [searchTree, isSearchMode]);

  // ---------------------------------------------------------------------------
  // Tree interaction
  // ---------------------------------------------------------------------------

  const toggle = (path: string) =>
    setExpanded((prev) => { const next = new Set(prev); next.has(path) ? next.delete(path) : next.add(path); return next; });

  const handleLoadChildren = async (node: FileNode) => {
    setLoadingNodes((prev) => new Set(prev).add(node.path));
    await loadChildren(node);
    setLoadingNodes((prev) => { const next = new Set(prev); next.delete(node.path); return next; });
  };

  const handleFileSelect = (path: string) => {
    setSelectedFilePath(path);
    onFileSelect?.(path);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const renderNode = (node: FileNode, depth: number) => {
    const rootPath = root?.path;
    const relativePath =
      rootPath && node.path.startsWith(rootPath)
        ? node.path.slice(rootPath.length).replace(/^[/\\]/, '') || '.'
        : node.path;
    const isDir = node.kind === 'dir';
    const isRoot = root?.path === node.path;
    const isExpanded = expanded.has(node.path);
    const isLoadingChildren = loadingNodes.has(node.path);
    const extension = getExtension(node.name);
    const iconStyle =
      extension && extension in defaultStyles
        ? defaultStyles[extension as keyof typeof defaultStyles]
        : defaultStyles.txt;

    return (
      <div key={node.path}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (isDir) { if (!isExpanded && !node.children) void handleLoadChildren(node); toggle(node.path); return; }
            handleFileSelect(node.path);
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            if (isDir) { if (!isExpanded && !node.children) void handleLoadChildren(node); toggle(node.path); }
            else handleFileSelect(node.path);
          }}
          className="group/file-row flex w-full items-center gap-2 rounded-md px-2 py-1 pr-3 text-left text-sm hover:bg-accent"
          style={{ paddingLeft: depth * 12 }}
        >
          {isDir
            ? isExpanded
              ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            : <span className="w-4" />
          }
          {!isDir && <span className="h-4 w-4 shrink-0"><FileIcon extension={extension} {...iconStyle} /></span>}
          <span className="truncate">{node.name}</span>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {isDir && isLoadingChildren && <span className="text-xs text-muted-foreground">Loading…</span>}
            {!isRoot && (
              <Button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPrompt(prompt ? `${prompt} ${relativePath}` : relativePath); triggerFocus(); }}
                variant="ghost" size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground opacity-0 group-hover/file-row:opacity-100 transition-opacity"
                aria-label={`Insert ${node.name}`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {isDir && isExpanded && node.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  if (!folder) return <div className="text-sm text-muted-foreground p-4">No folder selected.</div>;

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0">
      {/* Search input */}
      <div className="shrink-0 px-1 pt-1 pb-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="filter files…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-7 h-9 bg-accent/30 border-transparent hover:bg-accent/50 focus-visible:bg-accent/50 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors" aria-label="Clear search">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-1 min-h-0">
        {isSearchMode && (
          <>
            {searching && <div className="text-xs text-muted-foreground py-4 text-center">Searching…</div>}
            {!searching && searchResults.length === 0 && <div className="text-xs text-muted-foreground py-4 text-center">No results found.</div>}
            {!searching && searchResults.length > 0 && (
              <div className="space-y-0.5">{searchTree.map((node) => renderNode(node, 0))}</div>
            )}
          </>
        )}
        {!isSearchMode && (
          <>
            {loading && <div className="text-xs text-muted-foreground py-4 text-center">Loading files…</div>}
            {error && <div className="text-xs text-destructive py-4 text-center">{error}</div>}
            {!loading && !error && !root && <div className="text-xs text-muted-foreground py-4 text-center">No files found.</div>}
            {!loading && !error && root && (
              <div className="space-y-0.5">
                {root.children?.length === 0
                  ? <div className="text-xs text-muted-foreground py-4 text-center">Empty folder.</div>
                  : root.children?.map((child) => renderNode(child, 0))
                }
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});
