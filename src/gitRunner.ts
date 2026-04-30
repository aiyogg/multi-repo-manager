import { execFile } from 'child_process';
import { logCommand, logResult } from './logger';

export interface GitResult {
  success: boolean;
  stdout: string;
  stderr: string;
  cwd: string;
}

export async function executeGit(cwd: string, args: string[], repoName: string = ''): Promise<string> {
  logCommand(repoName, args.join(' '));
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        logResult(repoName, false, stderr || error.message);
        reject(new Error(`git ${args.join(' ')} failed in ${cwd}: ${stderr || error.message}`));
      } else {
        logResult(repoName, true);
        resolve(stdout);
      }
    });
  });
}

export async function executeGitSafe(cwd: string, args: string[], repoName: string = ''): Promise<GitResult> {
  logCommand(repoName, args.join(' '));
  return new Promise((resolve) => {
    execFile('git', args, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      const result: GitResult = {
        success: !error,
        stdout: stdout ?? '',
        stderr: stderr ?? '',
        cwd,
      };
      logResult(repoName, result.success, result.success ? undefined : (result.stderr.trim() || 'command failed'));
      resolve(result);
    });
  });
}

export async function getBranches(cwd: string, repoName: string = ''): Promise<string[]> {
  const output = await executeGit(cwd, ['branch', '--list'], repoName);
  return output
    .split('\n')
    .map(line => line.replace(/^\*?\s+/, '').trim())
    .filter(line => line.length > 0);
}

export async function getLocalBranches(cwd: string, repoName: string = ''): Promise<string[]> {
  const output = await executeGit(cwd, ['branch'], repoName);
  return output
    .split('\n')
    .map(line => line.replace(/^\*?\s+/, '').trim())
    .filter(line => line.length > 0);
}

export async function switchBranch(cwd: string, branch: string, repoName: string = ''): Promise<GitResult> {
  return executeGitSafe(cwd, ['checkout', branch], repoName);
}

export async function stageAndCommit(cwd: string, message: string, repoName: string = ''): Promise<GitResult> {
  const addResult = await executeGitSafe(cwd, ['add', '-A'], repoName);
  if (!addResult.success) {
    return addResult;
  }
  return executeGitSafe(cwd, ['commit', '-m', message], repoName);
}

export async function pull(cwd: string, repoName: string = ''): Promise<GitResult> {
  return executeGitSafe(cwd, ['pull'], repoName);
}

export async function push(cwd: string, repoName: string = ''): Promise<GitResult> {
  return executeGitSafe(cwd, ['push'], repoName);
}

export async function fetch(cwd: string, repoName: string = ''): Promise<GitResult> {
  return executeGitSafe(cwd, ['fetch', '--all'], repoName);
}

export async function fetchOrigin(cwd: string, repoName: string = ''): Promise<GitResult> {
  return executeGitSafe(cwd, ['fetch', 'origin'], repoName);
}
