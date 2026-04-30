import * as vscode from 'vscode';
import { RepoDetector } from '../repoDetector';
import { getLocalBranches, stageAndCommit } from '../gitRunner';
import { logInfo } from '../logger';

export async function batchCommitCommand(detector: RepoDetector): Promise<void> {
  const repos = detector.getRepos();
  if (repos.length === 0) {
    vscode.window.showWarningMessage('No Git repositories detected.');
    return;
  }

  const message = await vscode.window.showInputBox({
    prompt: 'Enter commit message for all repos',
    placeHolder: 'Update something',
    ignoreFocusOut: true,
  });

  if (!message) {
    return;
  }

  logInfo(`Starting batch commit for ${repos.length} repos: "${message}"`);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Committing all repos',
      cancellable: true,
    },
    async (progress, token) => {
      let succeeded = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const repo of repos) {
        if (token.isCancellationRequested) { break; }
        if (!repo.hasChanges) {
          continue;
        }

        progress.report({ message: `${repo.name}` });

        const result = await stageAndCommit(repo.rootUri.fsPath, message, repo.name);
        if (result.success) {
          succeeded++;
        } else {
          failed++;
          errors.push(`${repo.name}: ${result.stderr.trim() || 'commit failed'}`);
        }
      }

      if (succeeded > 0) {
        vscode.window.showInformationMessage(
          `Committed ${succeeded}/${repos.length} repos successfully`
        );
      }
      if (failed > 0) {
        vscode.window.showWarningMessage(
          `${failed} repo(s) failed to commit:\n${errors.join('\n')}`
        );
      }
    }
  );

  await detector.detectRepos();
}
