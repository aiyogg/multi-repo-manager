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
exports.batchCommitCommand = batchCommitCommand;
const vscode = __importStar(require("vscode"));
const gitRunner_1 = require("../gitRunner");
const logger_1 = require("../logger");
async function batchCommitCommand(detector) {
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
    (0, logger_1.logInfo)(`Starting batch commit for ${repos.length} repos: "${message}"`);
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Committing all repos',
        cancellable: true,
    }, async (progress, token) => {
        let succeeded = 0;
        let failed = 0;
        const errors = [];
        for (const repo of repos) {
            if (token.isCancellationRequested) {
                break;
            }
            if (!repo.hasChanges) {
                continue;
            }
            progress.report({ message: `${repo.name}` });
            const result = await (0, gitRunner_1.stageAndCommit)(repo.rootUri.fsPath, message, repo.name);
            if (result.success) {
                succeeded++;
            }
            else {
                failed++;
                errors.push(`${repo.name}: ${result.stderr.trim() || 'commit failed'}`);
            }
        }
        if (succeeded > 0) {
            vscode.window.showInformationMessage(`Committed ${succeeded}/${repos.length} repos successfully`);
        }
        if (failed > 0) {
            vscode.window.showWarningMessage(`${failed} repo(s) failed to commit:\n${errors.join('\n')}`);
        }
    });
    await detector.detectRepos();
}
//# sourceMappingURL=batchCommit.js.map