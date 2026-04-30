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
exports.switchBranchCommand = switchBranchCommand;
const vscode = __importStar(require("vscode"));
const gitRunner_1 = require("../gitRunner");
const logger_1 = require("../logger");
async function switchBranchCommand(detector) {
    const repos = detector.getRepos();
    if (repos.length === 0) {
        vscode.window.showWarningMessage('No Git repositories detected.');
        return;
    }
    // Get all unique branches across repos
    const allBranches = [];
    for (const repo of repos) {
        try {
            const branches = await (0, gitRunner_1.getLocalBranches)(repo.rootUri.fsPath, repo.name);
            for (const b of branches) {
                if (!allBranches.includes(b)) {
                    allBranches.push(b);
                }
            }
        }
        catch (e) {
            // ignore errors here
        }
    }
    if (allBranches.length === 0) {
        vscode.window.showWarningMessage('No branches found.');
        return;
    }
    // QuickPick for branch selection
    const selected = await vscode.window.showQuickPick(allBranches.map(b => ({ label: b })), {
        placeHolder: 'Select branch to switch all repos to',
        ignoreFocusOut: true,
    });
    if (!selected) {
        return;
    }
    const branchName = selected.label;
    (0, logger_1.logInfo)(`Switching all ${repos.length} repos to branch: ${branchName}`);
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Switching to ${branchName}`,
        cancellable: true,
    }, async (progress, token) => {
        let succeeded = 0;
        let failed = 0;
        const errors = [];
        for (const repo of repos) {
            if (token.isCancellationRequested) {
                break;
            }
            progress.report({ message: `${repo.name}` });
            const result = await (0, gitRunner_1.switchBranch)(repo.rootUri.fsPath, branchName, repo.name);
            if (result.success) {
                succeeded++;
            }
            else {
                failed++;
                errors.push(`${repo.name}: ${result.stderr.trim() || 'switch failed'}`);
            }
        }
        if (succeeded > 0) {
            vscode.window.showInformationMessage(`Switched ${succeeded}/${repos.length} repos to '${branchName}'`);
        }
        if (failed > 0) {
            vscode.window.showWarningMessage(`${failed} repo(s) failed to switch:\n${errors.join('\n')}`);
        }
    });
    await detector.detectRepos();
}
//# sourceMappingURL=switchBranch.js.map