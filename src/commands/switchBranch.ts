import * as vscode from 'vscode';
import { RepoDetector } from '../repoDetector';
import { getLocalBranches, getRemoteBranches, switchBranch } from '../gitRunner';
import { logInfo } from '../logger';

export async function switchBranchCommand(detector: RepoDetector): Promise<void> {
  const repos = detector.getRepos();
  if (repos.length === 0) {
    vscode.window.showWarningMessage('No Git repositories detected.');
    return;
  }

  const localBranchSet = new Set<string>();
  const remoteBranchSet = new Set<string>();

  for (const repo of repos) {
    try {
      const local = await getLocalBranches(repo.rootUri.fsPath, repo.name);
      local.forEach(b => localBranchSet.add(b));
    } catch { /* ignore */ }

    try {
      const remote = await getRemoteBranches(repo.rootUri.fsPath, repo.name);
      remote.forEach(b => remoteBranchSet.add(b));
    } catch { /* ignore */ }
  }

  if (localBranchSet.size === 0 && remoteBranchSet.size === 0) {
    vscode.window.showWarningMessage('No branches found.');
    return;
  }

  const items: vscode.QuickPickItem[] = [];

  // 本地分支优先展示
  for (const b of [...localBranchSet].sort()) {
    items.push({ label: b });
  }

  // 远端独有分支追加，标注 remote
  for (const b of [...remoteBranchSet].sort()) {
    if (!localBranchSet.has(b)) {
      items.push({ label: b, description: 'remote' });
    }
  }

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select branch to switch all repos to',
    ignoreFocusOut: true,
  });

  if (!selected) {
    return;
  }

  const branchName = selected.label;

  logInfo(`Switching all ${repos.length} repos to branch: ${branchName}`);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Switching to ${branchName}`,
      cancellable: true,
    },
    async (progress, token) => {
      let succeeded = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const repo of repos) {
        if (token.isCancellationRequested) { break; }
        progress.report({ message: `${repo.name}` });

        const result = await switchBranch(repo.rootUri.fsPath, branchName, repo.name);
        if (result.success) {
          succeeded++;
        } else {
          failed++;
          errors.push(`${repo.name}: ${result.stderr.trim() || 'switch failed'}`);
        }
      }

      if (succeeded > 0) {
        vscode.window.showInformationMessage(
          `Switched ${succeeded}/${repos.length} repos to '${branchName}'`
        );
      }
      if (failed > 0) {
        vscode.window.showWarningMessage(
          `${failed} repo(s) failed to switch:\n${errors.join('\n')}`
        );
      }
    }
  );

  await detector.detectRepos();
}
