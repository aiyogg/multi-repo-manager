import * as vscode from 'vscode';
import { RepoDetector, RepoInfo } from './repoDetector';
import { initLogger, showLogger } from './logger';
import { switchBranchCommand } from './commands/switchBranch';
import { batchCommitCommand } from './commands/batchCommit';
import { batchPullCommand } from './commands/batchPull';
import { batchPushCommand } from './commands/batchPush';
import { batchFetchCommand } from './commands/batchFetch';
import { showStatusCommand } from './commands/showStatus';

export function activate(context: vscode.ExtensionContext): void {
  // Initialize logger
  initLogger();

  const detector = new RepoDetector();

  // Status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    50
  );
  statusBarItem.command = 'multiRepo.showStatus';
  statusBarItem.name = 'Multi-Repo Manager';
  context.subscriptions.push(statusBarItem);

  // Tree data provider for the sidebar view
  const treeProvider = new MultiRepoTreeProvider(detector);
  const treeView = vscode.window.createTreeView('multiRepo.reposView', {
    treeDataProvider: treeProvider,
    showCollapseAll: false,
  });
  context.subscriptions.push(treeView);

  // Refresh function
  async function refresh() {
    await detector.detectRepos();
    updateStatusBar(statusBarItem, detector.getRepos());
    treeProvider.refresh();
    vscode.commands.executeCommand(
      'setContext',
      'multiRepo.hasRepos',
      detector.getRepos().length > 0
    );
  }

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('multiRepo.switchBranch', () => switchBranchCommand(detector).then(refresh)),
    vscode.commands.registerCommand('multiRepo.batchCommit', () => batchCommitCommand(detector).then(refresh)),
    vscode.commands.registerCommand('multiRepo.batchPull', () => batchPullCommand(detector).then(refresh)),
    vscode.commands.registerCommand('multiRepo.batchPush', () => batchPushCommand(detector).then(refresh)),
    vscode.commands.registerCommand('multiRepo.batchFetch', () => batchFetchCommand(detector).then(refresh)),
    vscode.commands.registerCommand('multiRepo.showStatus', () => showStatusCommand(detector)),
    vscode.commands.registerCommand('multiRepo.refreshRepos', refresh),
    vscode.commands.registerCommand('multiRepo.showLog', showLogger),

    // Click on a repo item in the tree view to open it
    vscode.commands.registerCommand('multiRepo.openRepo', (repo: RepoInfo) => {
      vscode.commands.executeCommand('vscode.openFolder', repo.rootUri, { forceNewWindow: false });
    })
  );

  // Watch for workspace folder changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => refresh())
  );

  // Initial detection
  refresh();
}

function updateStatusBar(item: vscode.StatusBarItem, repos: RepoInfo[]): void {
  if (repos.length === 0) {
    item.text = '$(git-branch) No repos';
    item.tooltip = 'Multi-Repo Manager: No Git repositories detected';
  } else {
    const changed = repos.filter(r => r.hasChanges).length;
    item.text = `$(git-branch) Repos: ${repos.length}${changed > 0 ? ` (${changed} changed)` : ''}`;
    const lines = repos.map(r => {
      const status = r.hasChanges ? 'has changes' : 'clean';
      const ab = r.ahead > 0 || r.behind > 0 ? ` ↑${r.ahead} ↓${r.behind}` : '';
      return `${r.name}: ${r.branch}${ab} [${status}]`;
    });
    item.tooltip = new vscode.MarkdownString(lines.join('  \n'));
  }
  item.show();
}

class MultiRepoTreeProvider implements vscode.TreeDataProvider<RepoTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<RepoTreeItem | undefined | null>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private detector: RepoDetector) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: RepoTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(_element?: RepoTreeItem): RepoTreeItem[] {
    const repos = this.detector.getRepos();
    return repos.map(repo => {
      const changeIcon = repo.hasChanges ? '●' : '○';
      const ab = repo.ahead > 0 || repo.behind > 0
        ? ` ↑${repo.ahead} ↓${repo.behind}`
        : '';
      const item = new RepoTreeItem(
        `${changeIcon} ${repo.name} — ${repo.branch}${ab}`,
        repo
      );
      item.tooltip = repo.rootUri.fsPath;
      item.description = repo.hasChanges ? 'has changes' : 'clean';
      item.iconPath = new vscode.ThemeIcon(
        repo.hasChanges ? 'source-control' : 'git-branch'
      );
      item.command = {
        command: 'multiRepo.openRepo',
        title: 'Open Repo',
        arguments: [repo],
      };
      return item;
    });
  }
}

class RepoTreeItem extends vscode.TreeItem {
  constructor(label: string, public readonly repo: RepoInfo) {
    super(label, vscode.TreeItemCollapsibleState.None);
  }
}

export function deactivate(): void {
  // Nothing to clean up
}
