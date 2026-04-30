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
exports.showStatusCommand = showStatusCommand;
const vscode = __importStar(require("vscode"));
async function showStatusCommand(detector) {
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
//# sourceMappingURL=showStatus.js.map