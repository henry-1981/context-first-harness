# Requirements

## Basic mode

- No external dependencies
- Any AI agent that can read SKILL.md (Claude Code, Codex, Gemini CLI, etc.)

## Extended mode

- At least one AI CLI tool installed and authenticated
- Verify each CLI: `command -v <binary>` or `<binary> --version`

## CLI tools

Install and authenticate the CLIs listed under `council.members` in `council.config.yaml`. Members with missing CLIs are skipped during execution.

See `references/setup.md` for detailed installation instructions.
