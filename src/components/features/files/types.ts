export type EntryKind = 'file' | 'dir' | 'symlink';

export type FileNode = {
  name: string;
  path: string;
  kind: EntryKind;
  children?: FileNode[];
};

export type SearchResult = {
  name: string;
  path: string;
  relative_path: string;
  kind: EntryKind;
};

export type FileTreeProps = {
  folder: string;
  onFileSelect?: (path: string) => void;
};
