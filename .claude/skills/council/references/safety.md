# Safety

## Prompt safety

- Do not share sensitive information (credentials, personal data) in council prompts.
- Council prompts are passed as CLI arguments — they may appear in process listings.

## Environment variables

- In extended mode, child processes inherit the parent's full environment (`process.env`).
- This means API keys, tokens, and other environment variables are accessible to CLI tools.
- This is intentional — CLI tools need their own credentials to function.
- If you run untrusted CLI commands, be aware of what environment variables are set.

## Config security

- `council.config.yaml` is gitignored to prevent accidental commit of custom configurations.
- Do not add secrets to config files. CLI authentication should use each tool's native auth mechanism.
