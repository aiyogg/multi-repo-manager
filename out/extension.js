"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const repoDetector_1 = require("./repoDetector");
const logger_1 = require("./logger");
const switchBranch_1 = require("./commands/switchBranch");
const batchCommit_1 = require("./commands/batchCommit");
const batchPull_1 = require("./commands/batchPull");
const batchPush_1 = require("./commands/batchPush");
const batchFetch_1 = require("./commands/batchFetch");
const showStatus_1 = require("./commands/showStatus");
function activate(context) {
    // Initialize logger
    (0, logger_1.initLogger)();
    const detector = new repoDetector_1.RepoDetector();
    // Status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
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
        vscode.commands.executeCommand('setContext', 'multiRepo.hasRepos', detector.getRepos().length > 0);
    }
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('multiRepo.switchBranch', () => (0, switchBranch_1.switchBranchCommand)(detector).then(refresh)), vscode.commands.registerCommand('multiRepo.batchCommit', () => (0, batchCommit_1.batchCommitCommand)(detector).then(refresh)), vscode.commands.registerCommand('multiRepo.batchPull', () => (0, batchPull_1.batchPullCommand)(detector).then(refresh)), vscode.commands.registerCommand('multiRepo.batchPush', () => (0, batchPush_1.batchPushCommand)(detector).then(refresh)), vscode.commands.registerCommand('multiRepo.batchFetch', () => (0, batchFetch_1.batchFetchCommand)(detector).then(refresh)), vscode.commands.registerCommand('multiRepo.showStatus', () => (0, showStatus_1.showStatusCommand)(detector)), vscode.commands.registerCommand('multiRepo.refreshRepos', refresh), vscode.commands.registerCommand('multiRepo.showLog', logger_1.showLogger), 
    // Click on a repo item in the tree view to open it
    vscode.commands.registerCommand('multiRepo.openRepo', (repo) => {
        vscode.commands.executeCommand('vscode.openFolder', repo.rootUri, { forceNewWindow: false });
    }));
    // Watch for workspace folder changes
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => refresh()));
    // Initial detection
    refresh();
}
function updateStatusBar(item, repos) {
    if (repos.length === 0) {
        item.text = '$(git-branch) No repos';
        item.tooltip = 'Multi-Repo Manager: No Git repositories detected';
    }
    else {
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
class MultiRepoTreeProvider {
    constructor(detector) {
        this.detector = detector;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(_element) {
        const repos = this.detector.getRepos();
        return repos.map(repo => {
            const changeIcon = repo.hasChanges ? '●' : '○';
            const ab = repo.ahead > 0 || repo.behind > 0
                ? ` ↑${repo.ahead} ↓${repo.behind}`
                : '';
            const item = new RepoTreeItem(`${changeIcon} ${repo.name} — ${repo.branch}${ab}`, repo);
            item.tooltip = repo.rootUri.fsPath;
            item.description = repo.hasChanges ? 'has changes' : 'clean';
            item.iconPath = new vscode.ThemeIcon(repo.hasChanges ? 'source-control' : 'git-branch');
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
    constructor(label, repo) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.repo = repo;
    }
}
function deactivate() {
    // Nothing to clean up
}
//# sourceMappingURL=extension.js.map