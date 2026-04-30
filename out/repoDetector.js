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
exports.RepoDetector = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const gitRunner_1 = require("./gitRunner");
class RepoDetector {
    constructor() {
        this.repos = [];
    }
    async detectRepos() {
        this.repos = [];
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return this.repos;
        }
        for (const folder of workspaceFolders) {
            await this.scanFolder(folder.uri);
        }
        if (workspaceFolders.length === 1) {
            await this.scanForNestedRepos(workspaceFolders[0].uri);
        }
        return this.repos;
    }
    async scanFolder(uri) {
        if (this.isGitRepo(uri.fsPath)) {
            const info = await this.getRepoInfo(uri);
            if (info && !this.repos.some(r => r.rootUri.fsPath === uri.fsPath)) {
                this.repos.push(info);
            }
        }
    }
    async scanForNestedRepos(rootUri) {
        const entries = await vscode.workspace.fs.readDirectory(rootUri);
        for (const [name, type] of entries) {
            if (type === vscode.FileType.Directory && !name.startsWith('.') && name !== 'node_modules') {
                const subUri = vscode.Uri.joinPath(rootUri, name);
                if (this.isGitRepo(subUri.fsPath)) {
                    const info = await this.getRepoInfo(subUri);
                    if (info && !this.repos.some(r => r.rootUri.fsPath === subUri.fsPath)) {
                        this.repos.push(info);
                    }
                }
            }
        }
    }
    isGitRepo(dirPath) {
        return fs.existsSync(path.join(dirPath, '.git'));
    }
    async getRepoInfo(uri) {
        const cwd = uri.fsPath;
        const name = path.basename(cwd);
        try {
            const branch = (await (0, gitRunner_1.executeGit)(cwd, ['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
            const status = await (0, gitRunner_1.executeGit)(cwd, ['status', '--porcelain']);
            const hasChanges = status.trim().length > 0;
            let ahead = 0;
            let behind = 0;
            try {
                const tracking = (await (0, gitRunner_1.executeGit)(cwd, ['rev-parse', '--abbrev-ref', '@{upstream}'])).trim();
                if (tracking) {
                    const revRange = tracking + '...HEAD';
                    const countResult = (await (0, gitRunner_1.executeGit)(cwd, ['rev-list', '--left-right', '--count', revRange])).trim();
                    const parts = countResult.split(/\s+/);
                    if (parts.length === 2) {
                        behind = parseInt(parts[0], 10) || 0;
                        ahead = parseInt(parts[1], 10) || 0;
                    }
                }
            }
            catch {
                // No upstream tracking branch
            }
            return { rootUri: uri, name, branch, hasChanges, ahead, behind };
        }
        catch {
            return undefined;
        }
    }
    getRepos() {
        return this.repos;
    }
}
exports.RepoDetector = RepoDetector;
//# sourceMappingURL=repoDetector.js.map