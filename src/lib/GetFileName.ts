export function getFileName(path: string) {
  return path.split(/[\\/]/).pop()!;
}