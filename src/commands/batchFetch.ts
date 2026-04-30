import * as vscode from 'vscode';
import { RepoDetector } from '../repoDetector';
import { fetch } from '../gitRunner';
import { logInfo } from '../logger';

export async function batchFetchCommand(detector: RepoDetector): Promise<void> {
  const repos = detector.getRepos();
  if (repos.length === 0) {
    vscode.window.showWarningMessage('No Git repositories detected.');
    return;
  }

  logInfo(`Starting batch fetch for ${repos.length} repos...`);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Fetching all repos',
      cancellable: true,
    },
    async (progress, token) => {
      let succeeded = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const repo of repos) {
        if (token.isCancellationRequested) { break; }
        progress.report({ message: `${repo.name}` });

        const result = await fetch(repo.rootUri.fsPath, repo.name);
        if (result.success) {
          succeeded++;
        } else {
          failed++;
          errors.push(`${repo.name}: ${result.stderr.trim() || 'fetch failed'}`);
        }
      }

      if (succeeded > 0) {
        vscode.window.showInformationMessage(
          `Fetched ${succeeded}/${repos.length} repos successfully`
        );
      }
      if (failed > 0) {
        vscode.window.showWarningMessage(
          `${failed} repo(s) failed to fetch:\n${errors.join('\n')}`
        );
      }
    }
  );

  await detector.detectRepos();
}
