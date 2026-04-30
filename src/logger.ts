import * as vscode from 'vscode';

let channel: vscode.OutputChannel;

export function initLogger(): vscode.OutputChannel {
  channel = vscode.window.createOutputChannel('Multi-Repo Manager');
  return channel;
}

export function getLogger(): vscode.OutputChannel {
  if (!channel) {
    return initLogger();
  }
  return channel;
}

export function logInfo(message: string): void {
  const logger = getLogger();
  logger.appendLine(`[INFO] ${timestamp()} ${message}`);
}

export function logError(message: string): void {
  const logger = getLogger();
  logger.appendLine(`[ERROR] ${timestamp()} ${message}`);
}

export function logSuccess(message: string): void {
  const logger = getLogger();
  logger.appendLine(`[OK] ${timestamp()} ${message}`);
}

export function logCommand(repo: string, cmd: string): void {
  const logger = getLogger();
  logger.appendLine(`[RUN] ${timestamp()} [${repo}] git ${cmd}`);
}

export function logResult(repo: string, success: boolean, detail?: string): void {
  const logger = getLogger();
  const icon = success ? '[OK]' : '[FAIL]';
  const msg = detail ? ` ${detail}` : '';
  logger.appendLine(`${icon} ${timestamp()} [${repo}]${msg}`);
}

export function showLogger(): void {
  getLogger().show();
}

function timestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false });
}
