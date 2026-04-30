<p align="center"><img src="https://github.com/aiyogg/multi-repo-manager/raw/main/icon.png" alt="Multi-Repo Manager Logo" width="200" /></p>

# Multi-Repo Manager

> Manage multiple Git repositories in VSCode with one-click batch operations — pull, push, commit, branch switch, and fetch across all repos simultaneously.

## Why This Extension?

If you work with a **multi-repo workspace** — like a monorepo split across several packages, or multiple microservices — you know the pain:

- Switching branches means running `git checkout` in 5 different folders
- Each `git pull` is its own terminal tab
- Committing changes across repos is repetitive and error-prone

**Multi-Repo Manager** solves that. Open a multi-root workspace in VSCode, and it automatically detects every Git repo inside. Then batch-operate on all of them with a single command.

## Features

### 🎯 Core Operations

| Feature | What it does |
|---------|-------------|
| **Switch Branch** | Select a branch — ALL repos check it out at once |
| **Batch Commit** | Type one message — applied to every repo with uncommitted changes |
| **Pull All** | `git pull` across every repo simultaneously |
| **Push All** | `git push` across every repo (with confirmation dialog) |
| **Fetch All** | `git fetch --all` to update remote refs without merging |

### 📊 Visibility

- **Status bar** shows `Repos: N` with change count at a glance
- **Sidebar view** lists each repo, its current branch, and clean/dirty state
- **Output channel** (`View → Output → Multi-Repo Manager`) logs every git command as it runs — no black box

### 🔧 Smart Detection

- Auto-detects Git repos in multi-root workspaces
- Supports nested repos inside parent folders
- Re-scans automatically when workspace folders change

## Requirements

- **VSCode 1.85.0** or higher
- Git must be installed and accessible from PATH

## Installation

### Option 1 — VSCode Marketplace *(coming soon)*

Search for **"Multi-Repo Manager"** in the Extensions panel and install.

### Option 2 — Manual Install

Download the `.vsix` file from the [Releases](https://github.com/aiyogg/multi-repo-manager/releases) page, then:

1. In VSCode, press `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Type `Extensions: Install from VSIX`
3. Select the downloaded `.vsix` file

## Usage

### Getting Started

1. Open VSCode with a workspace containing multiple Git repositories
   - You can use **multi-root workspace**: `File → Open Folder` → add multiple folders
   - Or open a parent folder that contains nested Git repos
2. The status bar shows `Repos: N` once repos are detected
3. Press `Ctrl+Shift+P` / `Cmd+Shift+P` and search for `Multi-Repo:` commands

### Available Commands

| Command | Description |
|---------|-------------|
| `Multi-Repo: Switch Branch (All Repos)` | Pick a branch — all repos check it out |
| `Multi-Repo: Batch Commit` | Type a message — commits all repos with changes |
| `Multi-Repo: Pull All` | Pull all repos |
| `Multi-Repo: Push All` | Push all repos (asks for confirmation first) |
| `Multi-Repo: Fetch All` | Fetch from all remotes |
| `Multi-Repo: Show Repo Status` | Display detailed status for each repo |
| `Multi-Repo: Refresh Repos` | Re-scan workspace for repos |

### Output Log

To see exactly what git commands are running:

1. `View → Output`
2. In the dropdown, select **"Multi-Repo Manager"**

Each command logs its execution with timestamps:

```
[RUN] 14:23:01 [my-app] git pull
[OK]  14:23:03 [my-app]
[RUN] 14:23:03 [shared-lib] git pull
[FAIL] 14:23:05 [shared-lib] error: Your local changes would be overwritten...
```

## Troubleshooting

### No repos detected

- Make sure each repo has a valid `.git` folder
- Try `Multi-Repo: Refresh Repos` to re-scan
- If using a multi-root workspace, add each repo folder individually via `File → Add Folder to Workspace`

### Push/Pull fails

- Check the Output log for the specific error message
- Common cause: uncommitted local changes conflicting with remote changes
- Use `git stash` or commit changes before pulling

### Permission denied

- Ensure Git is installed and accessible from terminal: run `git --version` in a terminal
- On macOS, you may need to allow VSCode to access Git in System Preferences

## Architecture

```
src/
├── extension.ts          # Entry point, command registration, status bar, tree view
├── logger.ts            # OutputChannel wrapper for logging
├── repoDetector.ts      # Scans workspace for .git folders
├── gitRunner.ts         # Executes git commands via child_process
└── commands/
    ├── switchBranch.ts  # Batch branch switch
    ├── batchCommit.ts   # Batch commit with same message
    ├── batchPull.ts     # Batch git pull
    ├── batchPush.ts     # Batch git push (with confirmation)
    └── batchFetch.ts    # Batch git fetch
```

## Contributing

Issues and PRs are welcome! If you find a bug or want a new feature, open an issue.

## License

MIT
