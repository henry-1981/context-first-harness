---
name: tool-setup
origin: "Original work — Skills for Workers project"
description: >
  Guide MCP server setup for Google Workspace and Notion integration.
  Detects environment (Cowork vs CLI), routes to optimal setup path.
  Track 1: Cowork built-in plugins. Track 2: managed-mcp.json org deployment.
  Track 3: CLI gws manual setup.
  Triggers: tool setup, MCP 설정, 도구 설정, 도구 연결, Google 연결,
  Notion 연결, workspace 연결, 워크스페이스 설정, connect tools,
  Google Drive MCP, 구글 연결, 노션 연결, Cowork 설정
---

# Tool Setup

Google Workspace·Notion MCP 서버를 Claude에 연결하는 가이드. 환경에 따라 최적 경로로 안내한다.

## Tracks Overview

| Track | 환경 | 방법 | 대상 |
|-------|------|------|------|
| Track 1 | Cowork (웹) | 내장 플러그인 활성화 | Cowork 사용자 |
| Track 2 | 조직 전체 배포 | `managed-mcp.json` | IT Admin |
| Track 3 | Claude Code (CLI) | `gws` CLI 수동 설정 | CLI 사용자 |

## Workflow

### Phase 1: Detect Environment

1. AskUserQuestion — 사용 환경:
   - **Cowork** (웹 브라우저에서 Claude 사용) → Track 1
   - **Claude Code CLI** (터미널에서 `claude` 명령) → Track 3
   - **IT Admin** (조직 전체 MCP 배포 준비) → Track 2

2. Run `claude mcp list` — check currently connected MCP servers
3. Report connected vs missing tools

### Phase 2: Select Tools
- AskUserQuestion: Which tools to set up? (multiSelect)
  - [ ] Google Workspace (Drive, Gmail, Calendar, Docs, Sheets)
  - [ ] Notion

### Phase 3: Setup by Track

#### Track 1: Cowork — 내장 플러그인 활성화

Cowork Enterprise/Team 플랜에는 Google Workspace 플러그인(Drive, Gmail, Calendar)이 내장되어 있다.

1. 확인: Cowork 좌측 메뉴 또는 Settings → Connectors에서 Google Workspace 플러그인 상태 확인
2. **활성화됨** → 바로 사용 가능. Phase 4로 이동
3. **비활성화됨** → Admin에게 활성화 요청. 아래 메시지 제공:
   > "Cowork에서 Google Workspace 플러그인(Drive, Gmail, Calendar) 활성화를 요청합니다. Settings → Connectors에서 설정 가능합니다."
4. Admin이 활성화하면 OAuth 승인만 완료하면 됨

> **참고**: Cowork 내장 플러그인은 `gws` CLI와 별개입니다. Cowork에서는 내장 플러그인이 더 안정적이고 관리가 간편합니다.

Read `references/admin-guide.md` → "Track 1: Cowork 플러그인 관리" 섹션 참조 (Admin 작업)

#### Track 2: 조직 전체 배포 — managed-mcp.json

IT Admin이 `managed-mcp.json`을 배포하여 조직 내 모든 Claude Code 사용자에게 MCP 서버를 일괄 적용한다.

1. Read `references/admin-guide.md` → "Track 2: managed-mcp.json 배포" 섹션 참조
2. 배포 완료 후 사용자는 설정 없이 자동 연결됨

> **주의**: 이 Track은 Cowork가 아닌 CLI 사용자 대상 조직 배포용입니다.

#### Track 3: CLI 수동 설정 — gws

Claude Code CLI 환경에서 `gws` (googleworkspace/cli)를 직접 설치하고 연결한다.

> **주의**: `gws`는 Google이 공식 지원하지 않는 커뮤니티 프로젝트입니다 (pre-v1.0).

1. Run `node --version` — Node.js 18+ required. 없으면 설치 안내
2. AskUserQuestion — Authentication path (single question, show only selected path after):
   - "IT에서 Service Account 키를 받았다" → **Path A** (IT-Managed, ~15min)
   - "직접 설정해야 한다" → **Path B** (Self-Managed, ~45min)
   - "모르겠다" → IT에 보낼 메시지: "Google Workspace MCP Service Account 키가 필요합니다"

3. Read `references/google-workspace-setup.md` — follow selected path only

4. AskUserQuestion — Service selection (multiSelect):
   - Drive, Gmail, Calendar, Docs, Sheets, Chat
   - Default recommended set: `drive,gmail,calendar,docs,sheets`
   - Tool limit warning: each service exposes 10-80 tools, total should stay under 100

5. Execute setup:
   ```bash
   npm install -g @googleworkspace/cli
   # Path A: set env var for SA key
   # Path B: manual OAuth flow
   claude mcp add google-workspace --transport stdio -- gws mcp -s <selected-services>
   ```

6. Verify: "Google Drive에서 최근 파일 목록을 보여줘"

#### Notion (All Tracks)

Notion은 환경에 관계없이 동일한 방법으로 설정한다.

1. AskUserQuestion — Setup method:
   - **Hosted MCP** (권장): Zero-install, OAuth only
   - **Plugin**: Local install

2. Read `references/notion-setup.md` — follow selected method

3. Execute setup:
   ```bash
   # Hosted MCP (recommended)
   claude mcp add notion --transport http --url https://mcp.notion.com/mcp
   # Then complete OAuth in browser
   ```

4. Verify: "Notion에서 페이지 검색해줘"

### Phase 4: Verify & Report

Output connection status table:

| Tool | Status | Server | Track |
|------|--------|--------|-------|
| Google Workspace | ✅ Connected | (varies by track) | Track N |
| Notion | ✅ Connected | hosted MCP | All |

## Decision Framework

### Track Selection
| 상황 | Track | 예상 시간 |
|------|-------|----------|
| Cowork 사용자 | Track 1 (내장 플러그인) | ~5min (Admin 활성화 후) |
| IT에서 조직 전체 배포 | Track 2 (managed-mcp.json) | Admin 1회 설정 |
| CLI + IT SA 키 보유 | Track 3 Path A | ~15min |
| CLI + 자가 설정 | Track 3 Path B | ~45min |

### Fallback
- Cowork 내장 플러그인 없음 → Track 3로 전환 (CLI 환경에서 설정 후 사용)
- gws 동작 불가 → IT팀 문의 안내

### Conflict Handling
- Google MCP already exists → ask: replace or keep?
- Notion MCP already exists → skip with notice

## Response Format

Each phase outputs:
1. **Phase header** with progress indicator
2. **Action items** with exact commands (Track별로 다름)
3. **Verification result** with pass/fail

Final output: connection status table (Phase 4)

## Key Principles

1. **Environment-first** — 환경을 먼저 감지하고 최적 Track으로 라우팅
2. **Non-destructive** — 기존 MCP 설정을 확인 없이 수정하지 않는다
3. **Progressive** — 선택한 도구만 설정 (불필요한 도구 강제하지 않음)
4. **Transparent** — 비공식/커뮤니티 도구는 명확히 표시
5. **Admin-friendly** — IT Admin용 배포 가이드 분리 제공

## References

- `references/google-workspace-setup.md` — Track 3: CLI gws 설정 가이드
- `references/notion-setup.md` — Notion 설정 가이드 (All Tracks)
- `references/admin-guide.md` — Track 1: Cowork 관리 + Track 2: managed-mcp.json + SA 키 배포
