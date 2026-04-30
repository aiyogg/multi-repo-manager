import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { executeGit } from './gitRunner';

export interface RepoInfo {
  rootUri: vscode.Uri;
  name: string;
  branch: string;
  hasChanges: boolean;
  ahead: number;
  behind: number;
}

export class RepoDetector {
  private repos: RepoInfo[] = [];

  async detectRepos(): Promise<RepoInfo[]> {
    this.repos = [];

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return this.repos;
    }

    for (const folder of workspaceFolders) {
      await this.scanFolder(folder.uri);
    }

    if (workspaceFolders.length === 1) {
      await this.scanForNestedRepos(workspaceFolders[0].uri);
    }

    return this.repos;
  }

  private async scanFolder(uri: vscode.Uri): Promise<void> {
    if (this.isGitRepo(uri.fsPath)) {
      const info = await this.getRepoInfo(uri);
      if (info && !this.repos.some(r => r.rootUri.fsPath === uri.fsPath)) {
        this.repos.push(info);
      }
    }
  }

  private async scanForNestedRepos(rootUri: vscode.Uri): Promise<void> {
    const entries = await vscode.workspace.fs.readDirectory(rootUri);
    for (const [name, type] of entries) {
      if (type === vscode.FileType.Directory && !name.startsWith('.') && name !== 'node_modules') {
        const subUri = vscode.Uri.joinPath(rootUri, name);
        if (this.isGitRepo(subUri.fsPath)) {
          const info = await this.getRepoInfo(subUri);
          if (info && !this.repos.some(r => r.rootUri.fsPath === subUri.fsPath)) {
            this.repos.push(info);
          }
        }
      }
    }
  }

  private isGitRepo(dirPath: string): boolean {
    return fs.existsSync(path.join(dirPath, '.git'));
  }

  private async getRepoInfo(uri: vscode.Uri): Promise<RepoInfo | undefined> {
    const cwd = uri.fsPath;
    const name = path.basename(cwd);

    try {
      const branch = (await executeGit(cwd, ['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
      const status = await executeGit(cwd, ['status', '--porcelain']);
      const hasChanges = status.trim().length > 0;

      let ahead = 0;
      let behind = 0;
      try {
        const tracking = (await executeGit(cwd, ['rev-parse', '--abbrev-ref', '@{upstream}'])).trim();
        if (tracking) {
          const revRange = tracking + '...HEAD';
          const countResult = (await executeGit(cwd, ['rev-list', '--left-right', '--count', revRange])).trim();
          const parts = countResult.split(/\s+/);
          if (parts.length === 2) {
            behind = parseInt(parts[0], 10) || 0;
            ahead = parseInt(parts[1], 10) || 0;
          }
        }
      } catch {
        // No upstream tracking branch
      }

      return { rootUri: uri, name, branch, hasChanges, ahead, behind };
    } catch {
      return undefined;
    }
  }

  getRepos(): RepoInfo[] {
    return this.repos;
  }
}
