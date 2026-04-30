"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeGit = executeGit;
exports.executeGitSafe = executeGitSafe;
exports.getBranches = getBranches;
exports.getLocalBranches = getLocalBranches;
exports.switchBranch = switchBranch;
exports.stageAndCommit = stageAndCommit;
exports.pull = pull;
exports.push = push;
exports.fetch = fetch;
exports.fetchOrigin = fetchOrigin;
const child_process_1 = require("child_process");
const logger_1 = require("./logger");
async function executeGit(cwd, args, repoName = '') {
    (0, logger_1.logCommand)(repoName, args.join(' '));
    return new Promise((resolve, reject) => {
        (0, child_process_1.execFile)('git', args, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) {
                (0, logger_1.logResult)(repoName, false, stderr || error.message);
                reject(new Error(`git ${args.join(' ')} failed in ${cwd}: ${stderr || error.message}`));
            }
            else {
                (0, logger_1.logResult)(repoName, true);
                resolve(stdout);
            }
        });
    });
}
async function executeGitSafe(cwd, args, repoName = '') {
    (0, logger_1.logCommand)(repoName, args.join(' '));
    return new Promise((resolve) => {
        (0, child_process_1.execFile)('git', args, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            const result = {
                success: !error,
                stdout: stdout ?? '',
                stderr: stderr ?? '',
                cwd,
            };
            (0, logger_1.logResult)(repoName, result.success, result.success ? undefined : (result.stderr.trim() || 'command failed'));
            resolve(result);
        });
    });
}
async function getBranches(cwd, repoName = '') {
    const output = await executeGit(cwd, ['branch', '--list'], repoName);
    return output
        .split('\n')
        .map(line => line.replace(/^\*?\s+/, '').trim())
        .filter(line => line.length > 0);
}
async function getLocalBranches(cwd, repoName = '') {
    const output = await executeGit(cwd, ['branch'], repoName);
    return output
        .split('\n')
        .map(line => line.replace(/^\*?\s+/, '').trim())
        .filter(line => line.length > 0);
}
async function switchBranch(cwd, branch, repoName = '') {
    return executeGitSafe(cwd, ['checkout', branch], repoName);
}
async function stageAndCommit(cwd, message, repoName = '') {
    const addResult = await executeGitSafe(cwd, ['add', '-A'], repoName);
    if (!addResult.success) {
        return addResult;
    }
    return executeGitSafe(cwd, ['commit', '-m', message], repoName);
}
async function pull(cwd, repoName = '') {
    return executeGitSafe(cwd, ['pull'], repoName);
}
async function push(cwd, repoName = '') {
    return executeGitSafe(cwd, ['push'], repoName);
}
async function fetch(cwd, repoName = '') {
    return executeGitSafe(cwd, ['fetch', '--all'], repoName);
}
async function fetchOrigin(cwd, repoName = '') {
    return executeGitSafe(cwd, ['fetch', 'origin'], repoName);
}
//# sourceMappingURL=gitRunner.js.map