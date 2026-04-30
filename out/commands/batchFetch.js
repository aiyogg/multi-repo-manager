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
exports.batchFetchCommand = batchFetchCommand;
const vscode = __importStar(require("vscode"));
const gitRunner_1 = require("../gitRunner");
const logger_1 = require("../logger");
async function batchFetchCommand(detector) {
    const repos = detector.getRepos();
    if (repos.length === 0) {
        vscode.window.showWarningMessage('No Git repositories detected.');
        return;
    }
    (0, logger_1.logInfo)(`Starting batch fetch for ${repos.length} repos...`);
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Fetching all repos',
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
            const result = await (0, gitRunner_1.fetch)(repo.rootUri.fsPath, repo.name);
            if (result.success) {
                succeeded++;
            }
            else {
                failed++;
                errors.push(`${repo.name}: ${result.stderr.trim() || 'fetch failed'}`);
            }
        }
        if (succeeded > 0) {
            vscode.window.showInformationMessage(`Fetched ${succeeded}/${repos.length} repos successfully`);
        }
        if (failed > 0) {
            vscode.window.showWarningMessage(`${failed} repo(s) failed to fetch:\n${errors.join('\n')}`);
        }
    });
    await detector.detectRepos();
}
//# sourceMappingURL=batchFetch.js.map