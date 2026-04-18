# IT Admin 가이드 — MCP 서버 조직 배포

## 목적

조직 내 사용자가 Google Workspace·Notion MCP 서버를 원활하게 사용할 수 있도록,
IT Admin이 사전 설정을 완료합니다. 환경에 따라 3가지 배포 방법이 있습니다.

| Track | 방법 | 대상 환경 | Admin 작업량 |
|-------|------|----------|-------------|
| Track 1 | Cowork 내장 플러그인 활성화 | Cowork (웹) | 최소 (~5분) |
| Track 2 | managed-mcp.json 배포 | Claude Code CLI (조직) | 중간 (~30분) |
| Track 3 | Service Account 키 배포 | Claude Code CLI (개별) | 높음 (SA 생성+배포) |

---

## Track 1: Cowork 플러그인 관리

Cowork Enterprise/Team 플랜에는 Google Workspace MCP 커넥터가 내장되어 있습니다.
Admin이 활성화하면 사용자는 OAuth 승인만 완료하면 됩니다.

### 활성화 절차

1. [claude.ai/settings/connectors](https://claude.ai/settings/connectors) 접속 (Admin 계정)
2. Google Workspace 커넥터 찾기:
   - Google Drive
   - Gmail
   - Google Calendar
3. 필요한 커넥터 활성화 (토글 ON)
4. (선택) 팀/부서별 접근 제어:
   - per-user provisioning으로 특정 팀에만 할당
   - auto-install 설정으로 자동 배포 가능

### Notion

- Notion MCP도 동일 경로에서 활성화 가능
- 또는 사용자가 직접 Hosted MCP 등록 (별도 Admin 작업 불필요)

### 사용자 안내

활성화 후 사용자에게 전달할 메시지:
> "Cowork에서 Google Workspace 커넥터가 활성화되었습니다.
> 처음 사용 시 OAuth 승인 팝업이 나타나면 회사 계정으로 로그인해 주세요."

### 장점

- gws CLI 설치 불필요
- SA 키 배포 불필요
- Anthropic이 관리하는 공식 커넥터
- 세션 간 설정 자동 유지

---

## Track 2: managed-mcp.json 배포

Claude Code CLI 사용자에게 MCP 서버를 조직 전체에 일괄 적용합니다.
사용자는 추가 설정 없이 자동으로 MCP 서버가 연결됩니다.

### 개요

`managed-mcp.json` 파일을 시스템 디렉토리에 배포하면,
해당 머신의 모든 Claude Code 사용자에게 동일한 MCP 서버가 자동 적용됩니다.

- 사용자가 MCP 서버를 추가/수정/삭제할 수 없음 (exclusive control)
- allowlist/denylist로 정책 세분화 가능

### 배포 경로

| OS | 경로 |
|----|------|
| macOS | `/Library/Application Support/ClaudeCode/managed-mcp.json` |
| Linux / WSL | `/etc/claude-code/managed-mcp.json` |
| Windows | `C:\Program Files\ClaudeCode\managed-mcp.json` |

> 시스템 경로 (`~/` 아님) — 관리자 권한 필요

### 설정 파일 예시

```json
{
  "mcpServers": {
    "google-workspace": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@googleworkspace/cli", "mcp", "-s", "drive,gmail,calendar"],
      "env": {
        "GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE": "/etc/claude-mcp/sa-key.json",
        "GOOGLE_WORKSPACE_CLI_IMPERSONATED_USER": "${USER}@company.com"
      }
    },
    "notion": {
      "type": "http",
      "url": "https://mcp.notion.com/mcp"
    }
  }
}
```

### 환경변수 활용

- `${VAR}` 구문으로 환경변수 참조 가능
- `${VAR:-default}` 구문으로 기본값 지정 가능
- 사용자별 차별화: `${USER}`, `${HOME}` 등 시스템 변수 활용

### Policy 제어 (선택)

managed-mcp.json과 별도로, managed settings에서 allowlist/denylist 설정 가능:

```json
{
  "allowedMcpServers": [
    { "serverName": "google-workspace" },
    { "serverName": "notion" },
    { "serverUrl": "https://mcp.notion.com/*" }
  ],
  "deniedMcpServers": [
    { "serverUrl": "https://*.untrusted.com/*" }
  ]
}
```

### 주의사항

- managed-mcp.json이 있으면 사용자가 `claude mcp add`로 서버 추가 불가
- 유연성이 필요하면 managed-mcp.json 대신 allowlist만 사용
- Node.js가 설치된 환경에서만 gws stdio 서버 동작

---

## Track 3: Service Account 키 배포 (개별 CLI 사용자용)

비개발자가 GCP Console 접근 없이 Google Workspace MCP 서버를 연결할 수 있도록,
IT Admin이 Service Account 생성과 키 배포를 사전에 완료합니다.

사용자는 Admin이 배포한 키 파일로 환경변수 설정과 MCP 등록만 하면 됩니다.

### Service Account + Domain-wide Delegation 체크리스트

#### 1. GCP 프로젝트 설정

- [ ] [Google Cloud Console](https://console.cloud.google.com/) 에서 프로젝트 생성 (또는 기존 프로젝트 사용)
- [ ] 프로젝트 이름 예: `claude-mcp-workspace`

#### 2. API 활성화

"API 및 서비스" → "라이브러리"에서 아래 API를 활성화합니다:

- [ ] Google Drive API
- [ ] Gmail API
- [ ] Google Calendar API
- [ ] Google Docs API
- [ ] Google Sheets API
- [ ] (선택) Google Chat API
- [ ] (선택) Admin SDK API

> 필요한 서비스만 활성화하세요. 나중에 추가할 수 있습니다.

#### 3. Service Account 생성

- [ ] "IAM 및 관리자" → "서비스 계정" → "서비스 계정 만들기"
- [ ] 이름: `claude-mcp` (예시)
- [ ] 역할: 불필요 (Domain-wide Delegation으로 권한 부여)
- [ ] "키" 탭 → "키 추가" → "새 키 만들기" → JSON 선택
- [ ] JSON 키 파일 다운로드 → 안전한 위치에 보관

#### 4. Domain-wide Delegation 설정

- [ ] Google Admin Console ([admin.google.com](https://admin.google.com)) 접속
- [ ] "보안" → "API 제어" → "도메인 수준 위임 관리"
- [ ] "새로 추가" 클릭:
  - **Client ID**: Service Account의 고유 ID (JSON 파일 내 `client_id` 값)
  - **OAuth 범위**: 아래 "OAuth 스코프 최소화 가이드" 참조
- [ ] 저장 후 반영까지 최대 24시간 소요 (보통 수 분 이내)

#### 5. 키 배포

- [ ] 키 파일을 **보안 채널**로 배포 (암호화된 전송 수단 사용)
- [ ] 사용자에게 환경변수 설정 안내:
  ```bash
  export GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE=/path/to/key.json
  export GOOGLE_WORKSPACE_CLI_IMPERSONATED_USER=user@company.com
  ```
- [ ] 사용자별로 `IMPERSONATED_USER`를 본인 이메일로 설정하도록 안내
- [ ] **금지**: 이메일, 메신저, 공유 드라이브로 키 파일 직접 전달

### OAuth 스코프 최소화 가이드

> **중요**: `gws mcp -s drive,gmail`의 `-s` 플래그는 Claude에 노출되는 **도구만**
> 필터링합니다. OAuth 스코프 자체를 제한하지 않습니다.
> 스코프는 반드시 Domain-wide Delegation 설정에서 직접 관리해야 합니다.

#### 서비스별 필요 스코프

| 서비스 | OAuth 스코프 | 비고 |
|--------|-------------|------|
| Drive | `https://www.googleapis.com/auth/drive` | 읽기+쓰기 |
| Gmail (읽기) | `https://www.googleapis.com/auth/gmail.readonly` | 읽기 전용 |
| Gmail (전송) | `https://www.googleapis.com/auth/gmail.send` | 발송만 허용 |
| Calendar | `https://www.googleapis.com/auth/calendar` | 읽기+쓰기 |
| Docs | `https://www.googleapis.com/auth/documents` | 읽기+쓰기 |
| Sheets | `https://www.googleapis.com/auth/spreadsheets` | 읽기+쓰기 |
| Chat | `https://www.googleapis.com/auth/chat.messages` | 메시지 전송 |

#### 권장 최소 세트 (일반 업무)

Domain-wide Delegation에 등록할 스코프 (쉼표로 구분, 줄바꿈 없이 입력):

```
https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/documents,https://www.googleapis.com/auth/spreadsheets
```

#### 스코프 선택 원칙

- **최소 권한**: 실제 사용할 서비스의 스코프만 등록
- **읽기 우선**: Gmail은 `readonly`로 시작, 발송이 필요하면 `send` 추가
- **Chat 제외**: 대부분의 업무에 불필요. 명시적 요청 시에만 추가

### Security Notes

#### SA 키 보안

Service Account 키는 사실상 **비밀번호 없는 인증 토큰**입니다.

- 유출 시 Domain-wide Delegation 범위 내 **전체 Workspace 접근 가능**
- 키 파일 배포: 보안 채널 필수 (예: 1Password, 사내 Vault, 암호화 USB)
- 로컬 디스크 저장 시 파일 권한 제한: `chmod 600 key.json`
- git 커밋 방지: `.gitignore`에 아래 패턴 추가
  ```
  *-key.json
  service-account-*.json
  ```

#### 키 유출 대응

유출이 의심되면 즉시 아래 절차를 실행합니다:

1. GCP Console → Service Account → 해당 키 **즉시 삭제** (비활성화가 아닌 삭제)
2. 새 키 생성
3. 영향 받는 사용자에게 새 키 재배포 (보안 채널)
4. 감사 로그 확인: Admin Console → "보고서" → "감사 및 조사"
5. 비정상 접근 이력이 있으면 보안팀에 에스컬레이션

#### 키 로테이션

- **90일 주기** 로테이션 권장
- 자동화: GCP IAM API로 키 생성/삭제 스크립트 구성 가능
- 로테이션 시 기존 키 삭제 전 신규 키 배포 → 전환 → 구 키 삭제 순서

### Maintenance

#### 퇴사 처리

- Google Workspace 계정 비활성화 시 자동으로 접근 차단됨
- Service Account 키 회수나 별도 프로세스 불필요
- 기존 IT 퇴사 프로세스 그대로 활용

#### 서비스 추가/제거

**스코프 변경** (Admin 작업):

1. Admin Console → "보안" → "API 제어" → "도메인 수준 위임 관리"
2. 해당 Client ID의 스코프 수정
3. 반영까지 최대 24시간 (보통 수 분)

**사용자 측 MCP 재등록** (서비스 목록 변경 시):

```bash
claude mcp remove google-workspace
claude mcp add google-workspace -- npx -y @googleworkspace/cli@0.x mcp -s drive,gmail,calendar
```

#### 모니터링

- Admin Console → "보고서" → "감사 및 조사"에서 API 호출 로그 확인
- 비정상 패턴 (대량 다운로드, 심야 접근 등) 모니터링 권장

### FAQ

| 질문 | 답변 |
|------|------|
| 비용이 발생하나요? | GCP 프로젝트 생성은 무료. API 호출량에 따라 과금 가능하나, 일반 업무 수준은 무료 할당량 내 |
| 특정 서비스만 허용할 수 있나요? | 스코프로 API 수준 제한 가능. `-s` 플래그로 도구 노출도 제한 가능 (단, OAuth 스코프와 별개) |
| 컴플라이언스 이슈는? | SA 감사 로그 활성화, 키 로테이션 90일 주기, 최소 스코프 원칙 적용으로 대응 |
| gws가 불안정하면? | pre-v1.0이므로 breaking changes 가능. 검증된 버전 고정(`@0.x`), 문제 발생 시 IT 문의 |
| 여러 사용자가 같은 SA를 쓸 수 있나요? | 가능. `IMPERSONATED_USER`로 사용자별 컨텍스트 분리. 감사 로그에 impersonated user 기록됨 |
| 키를 분실하면? | GCP Console에서 기존 키 삭제 후 새 키 생성·재배포. 분실 키로 접근 불가해짐 |
