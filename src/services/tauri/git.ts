import { invoke } from '@tauri-apps/api/core';

export type GitStatusEntry = {
  path: string;
  index_status: string;
  worktree_status: string;
};

export type GitStatusResult = {
  repo_root: string;
  entries: GitStatusEntry[];
}

export type GitDiffStatsCounts = {
  additions: number;
  deletions: number;
}

export type GitDiffStatsResult = {
  staged: GitDiffStatsCounts;
  unstaged: GitDiffStatsCounts;
};

export type GitFileDiffResult = {
  old_content: string;
  new_content: string;
  has_changes: boolean;
};

export type GitFileDiffMetaResult = {
  old_bytes: number;
  new_bytes: number;
  total_bytes: number;
};

export type GitCreateWorktreeResult = {
  repo_root: string;
  worktree_path: string;
  existed: boolean;
  copied_env_files: string[];
};

export type GitApplyWorktreeResult = {
  changed_files: number;
};

export type GitHasWorktreeChangesResult = {
  has_changes: boolean;
};

export type GitBranchInfoResult = {
  owner: string;
  repo: string;
  branch: string;
};

export type GitBranchListResult = {
  current: string;
  branches: string[];
};

export async function isGitRepo(path: string): Promise<boolean> {
  return await invoke('is_git_repo', { path });
}

export async function gitBranchInfo(cwd: string) {
  return await invoke<GitBranchInfoResult>('git_branch_info', { cwd });
}

export async function gitListBranches(cwd: string) {
  return await invoke<GitBranchListResult>('git_list_branches', { cwd });
}

export async function gitCreateBranch(cwd: string, branch: string) {
  return await invoke<void>('git_create_branch', { cwd, branch });
}

export async function gitCheckoutBranch(cwd: string, branch: string) {
  return await invoke<void>('git_checkout_branch', { cwd, branch });
}

export async function gitStatus(cwd: string) {
  return await invoke<GitStatusResult>('git_status', { cwd });
}

export async function gitFileDiff(cwd: string, filePath: string, staged: boolean) {
  return await invoke<GitFileDiffResult>('git_file_diff', { cwd, filePath, staged });
}

export async function gitFileDiffMeta(cwd: string, filePath: string, staged: boolean) {
  return await invoke<GitFileDiffMetaResult>('git_file_diff_meta', {
    cwd,
    filePath,
    staged,
  });
}

export async function gitDiffStats(cwd: string) {
  return await invoke<GitDiffStatsResult>('git_diff_stats', { cwd });
}

export async function gitStageFiles(cwd: string, filePaths: string[]) {
  return await invoke<void>('git_stage_files', { cwd, filePaths });
}

export async function gitUnstageFiles(cwd: string, filePaths: string[]) {
  return await invoke<void>('git_unstage_files', { cwd, filePaths });
}

export async function gitReverseFiles(cwd: string, filePaths: string[], staged: boolean) {
  return await invoke<void>('git_reverse_files', { cwd, filePaths, staged });
}

export async function gitCreateWorktree(cwd: string, worktreeKey: string) {
  return await invoke<GitCreateWorktreeResult>('git_create_worktree', {
    cwd,
    worktreeKey,
  });
}

export async function gitRemoveWorktree(cwd: string, worktreeKey: string): Promise<void> {
  await invoke<void>('git_remove_worktree', { cwd, worktreeKey });
  return;
}

export async function gitApplyWorktreeChanges(cwd: string, worktreeKey: string) {
  return await invoke<GitApplyWorktreeResult>('git_apply_worktree_changes', {
    cwd,
    worktreeKey,
  });
}

export async function gitHasWorktreeChanges(cwd: string, worktreeKey: string) {
  return await invoke<GitHasWorktreeChangesResult>('git_has_worktree_changes', {
    cwd,
    worktreeKey,
  });
}

function resolveCwd(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash > 0 ? normalized.slice(0, lastSlash) : '.';
}

export async function getGitFileDiff<T = unknown>(filePath: string) {
  const cwd = resolveCwd(filePath);
  const diff = await invoke<GitFileDiffResult>('git_file_diff', {
    cwd,
    filePath,
    staged: false,
  });
  return {
    original_content: diff.old_content,
    current_content: diff.new_content,
    has_changes: diff.has_changes,
  } as T;
}

export async function gitCommit(cwd: string, message: string) {
  return await invoke<string>('git_commit', { cwd, message });
}

export async function gitPush(cwd: string, remote?: string, branch?: string) {
  return await invoke<string>('git_push', { cwd, remote, branch });
}
