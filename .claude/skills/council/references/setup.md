# Setup

## Prerequisites

- **Basic mode**: No dependencies. Works with any AI agent that can read SKILL.md.
- **Extended mode**: At least one AI CLI tool installed and authenticated.

## Installation

### Basic Mode (no CLI required)

1. Copy the skill to your skills directory (`~/.claude/skills/council/`)
2. The host agent reads SKILL.md and generates multi-persona responses directly

### Extended Mode (multi-model)

1. Copy the skill to your skills directory
2. Create `council.config.yaml` with `command` fields for each member
3. Install and authenticate AI CLI tools you want to use

## AI CLI Tools

| CLI | Install | Authenticate |
|-----|---------|-------------|
| Claude Code | `npm install -g @anthropic-ai/claude-code` | `claude` (first run) |
| Codex | `npm install -g @openai/codex` | `codex auth` |
| Gemini CLI | `npm install -g @google/gemini-cli` | `gemini` (first run) |

## Config Customization

Edit `council.config.yaml`:

### Add a member

```yaml
members:
  - name: my-cli
    command: "my-cli -p"
    persona: strategist    # Use a defined persona
    emoji: "🔮"
    color: "YELLOW"
```

### Add a persona

```yaml
personas:
  my-role:
    system_prompt: |
      You are a [role]. [instructions for this perspective].
```

### Remove a member

Delete or comment out the entry. Members with missing CLIs will be skipped.

### Adjust timeout

```yaml
settings:
  timeout: 300  # seconds per member (default is 180)
```
