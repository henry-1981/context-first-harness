# Troubleshooting

## missing_cli

**Symptom**: CLI command not found during execution.

**Cause**: The CLI command for this member is not installed or not in PATH.

**Fix**:
1. Check if the CLI exists: `command -v <binary>`
2. Install the missing CLI (see `references/setup.md`)
3. Or remove the member from `council.config.yaml`

## Timeout

**Symptom**: CLI does not respond within the configured timeout.

**Cause**: Model is slow or network issues.

**Fix**:
1. Increase timeout in `council.config.yaml`:
   ```yaml
   settings:
     timeout: 300  # default is 180
   ```

## All members failed

**Symptom**: Every member shows error or missing CLI.

**Fix**:
1. Check that at least one CLI is installed and authenticated
2. Verify CLIs work independently (e.g., `gemini -p "hello"`)
3. Consider using basic mode (remove `command` fields from members)

## CLI-specific issues

### Codex

- Codex may require `--skip-git-repo-check` when not in a trusted directory
- Update config command: `codex exec --skip-git-repo-check`

### Gemini

- The `-p` flag takes the prompt as the next argument: `gemini -p "prompt"`
- Ensure Gemini CLI is authenticated: `gemini` (interactive first run)

### Claude / zai

- Uses `-p` for non-interactive print mode: `claude -p "prompt"`
- `--model` flag selects the model: `claude -p --model <model-name> "prompt"`
