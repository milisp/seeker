import type { FileNode, SearchResult } from "./types";

export const getExtension = (name: string) => {
  const idx = name.lastIndexOf('.');
  if (idx <= 0 || idx === name.length - 1) return '';
  return name.slice(idx + 1).toLowerCase();
};

/**
 * Build a virtual FileNode tree from a flat list of search results.
 * Intermediate directory nodes are synthesised so the tree renders correctly.
 */
export function buildSearchTree(results: SearchResult[], rootPath: string): FileNode[] {
  const dirMap = new Map<string, FileNode>();
  const roots: FileNode[] = [];

  const getOrCreateDir = (absPath: string, name: string, parentChildren: FileNode[]): FileNode => {
    if (!dirMap.has(absPath)) {
      const node: FileNode = { name, path: absPath, kind: 'dir', children: [] };
      dirMap.set(absPath, node);
      parentChildren.push(node);
    }
    return dirMap.get(absPath)!;
  };

  for (const result of results) {
    const segments = result.relative_path.replace(/\\/g, '/').split('/');
    let currentPath = rootPath;
    let currentChildren = roots;

    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      const nextPath = currentPath + '/' + seg;
      const dir = getOrCreateDir(nextPath, seg, currentChildren);
      currentPath = nextPath;
      currentChildren = dir.children!;
    }

    currentChildren.push({
      name: result.name,
      path: result.path,
      kind: result.kind,
      ...(result.kind === 'dir' ? { children: [] } : {}),
    });
  }

  return roots;
}
