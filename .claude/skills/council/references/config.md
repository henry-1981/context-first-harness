# Configure members

## Quick start

Copy the example config:
```bash
cp council.config.example.yaml council.config.yaml
```

## Config structure

```yaml
council:
  chairman:
    role: "auto"  # auto | claude | codex | gemini | ...

  members:
    - name: claude
      command: "claude -p"       # Remove this line for basic mode
      persona: narrator          # Links to a persona definition
      emoji: "🧠"
      color: "CYAN"

  personas:
    narrator:
      system_prompt: |
        You are a narrator. Explain in plain language.

  settings:
    exclude_chairman_from_members: true
    timeout: 180
```

## Basic mode vs Extended mode

- **Basic mode**: Remove `command` fields from members. The host agent generates each persona's response directly.
- **Extended mode**: Keep `command` fields. Each member's CLI is called in parallel.

## Adding members

Append entries to `members`:
- `name`: stable identifier (lowercase, short)
- `command`: CLI invocation (optional — omit for basic mode)
- `persona`: key referencing a persona definition (optional)
- `emoji` and `color`: for readability (optional)

## Adding personas

Add entries under `personas`:
```yaml
personas:
  my-role:
    system_prompt: |
      You are a [role]. [perspective instructions].
```

Then assign to a member with `persona: my-role`.

## Notes

- Missing CLIs report `missing_cli` at runtime but don't crash the council
- The chairman is excluded from members by default (`exclude_chairman_from_members: true`)
