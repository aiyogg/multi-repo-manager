import * as vscode from 'vscode';
import { RepoDetector, RepoInfo } from '../repoDetector';

export async function showStatusCommand(detector: RepoDetector): Promise<void> {
  const repos = detector.getRepos();
  if (repos.length === 0) {
    vscode.window.showWarningMessage('No Git repositories detected.');
    return;
  }

  const items = repos.map(repo => {
    const changeIcon = repo.hasChanges ? '$(edit)' : '$(check)';
    const aheadBehind = repo.ahead > 0 || repo.behind > 0
      ? ` ↑${repo.ahead} ↓${repo.behind}`
      : '';
    return {
      label: `${changeIcon} ${repo.name}`,
      description: `${repo.branch}${aheadBehind}`,
      detail: repo.rootUri.fsPath,
      repo,
    };
  });

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: 'Multi-Repo Status — click a repo to open its folder',
  });

  if (picked) {
    vscode.commands.executeCommand('vscode.openFolder', picked.repo.rootUri, { forceNewWindow: false });
  }
}
