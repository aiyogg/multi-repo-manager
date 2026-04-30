import * as vscode from 'vscode';
import { RepoDetector } from '../repoDetector';
import { getLocalBranches, switchBranch } from '../gitRunner';
import { logInfo } from '../logger';

export async function switchBranchCommand(detector: RepoDetector): Promise<void> {
  const repos = detector.getRepos();
  if (repos.length === 0) {
    vscode.window.showWarningMessage('No Git repositories detected.');
    return;
  }

  // Get all unique branches across repos
  const allBranches: string[] = [];
  for (const repo of repos) {
    try {
      const branches = await getLocalBranches(repo.rootUri.fsPath, repo.name);
      for (const b of branches) {
        if (!allBranches.includes(b)) {
          allBranches.push(b);
        }
      }
    } catch (e) {
      // ignore errors here
    }
  }

  if (allBranches.length === 0) {
    vscode.window.showWarningMessage('No branches found.');
    return;
  }

  // QuickPick for branch selection
  const selected = await vscode.window.showQuickPick(
    allBranches.map(b => ({ label: b })),
    {
      placeHolder: 'Select branch to switch all repos to',
      ignoreFocusOut: true,
    }
  );

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
