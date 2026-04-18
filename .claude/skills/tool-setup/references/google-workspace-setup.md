# Google Workspace MCP 설정 가이드

## Overview

- **Server**: `gws` — [`@googleworkspace/cli`](https://www.npmjs.com/package/@googleworkspace/cli) npm package
- **Verified version**: `@googleworkspace/cli@0.x.x` (2026-03-02 출시)
- **Maintainer**: Google Workspace org (GitHub)
- **MCP built-in**: `gws mcp -s <services>` 한 줄로 서버 시작
- Discovery 기반으로 Google Workspace 전 API를 자동 지원

> **주의**: "Not officially supported by Google" — pre-v1.0이므로 breaking changes가 발생할 수 있습니다. 버전을 고정하고 업데이트 시 릴리스 노트를 반드시 확인하세요.

---

## 요구사항

- Node.js 18+
- npm (Node.js 설치 시 포함)

## 사전 확인

```bash
node --version    # v18+ 필요
npm --version     # 설치 확인
```

Node.js가 설치되어 있지 않다면:
1. <https://nodejs.org> 에서 **LTS** 버전 다운로드
2. 설치 완료 후 **터미널을 재시작**
3. 위 명령어로 버전 재확인

---

## 어떤 경로를 선택해야 하나요?

| 질문 | 답변 | 경로 |
|------|------|------|
| IT팀에서 Service Account 키 JSON 파일을 받았나요? | 예 | **Path A** (~15분) |
| IT팀에서 Service Account 키 JSON 파일을 받았나요? | 아니오 | **Path B** (~45분) |

하나의 경로만 따라가면 됩니다. 설정 완료 후 두 경로 모두 동일한 결과(MCP 서버 연결)를 얻습니다.

---

## Path A: IT-Managed (Service Account) — 권장, ~15분

IT팀에서 Service Account 키 JSON 파일을 수령한 경우.

### Step 1: gws 설치

```bash
npm install -g @googleworkspace/cli
```

설치 확인:

```bash
gws --version
```

### Step 2: 환경변수 설정

Service Account 키 파일의 **절대 경로**를 환경변수로 지정합니다.

**Mac / Linux** (`.zshrc` 또는 `.bashrc`에 추가 권장):

```bash
export GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE=/path/to/service-account-key.json
```

**Windows (CMD)**:

```cmd
set GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE=C:\path\to\service-account-key.json
```

**Windows (PowerShell)** (`$PROFILE`에 추가 권장):

```powershell
$env:GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE="C:\path\to\service-account-key.json"
```

> 영구 적용하려면 셸 프로필 파일(`.zshrc`, `.bashrc`, `$PROFILE`)에 위 라인을 추가하고 터미널을 재시작하세요.

### Step 3: 보안 주의사항

Service Account 키 파일은 사실상 **비밀번호 없는 인증 토큰**입니다.

- 이메일, 메신저, 채팅으로 키 파일 전달 **금지** → 보안 채널(암호화 전송, 사내 비밀 관리 시스템) 사용
- 키 파일을 Git 저장소에 커밋하지 마세요. `.gitignore`에 패턴 추가:
  ```
  service-account-*.json
  *-credentials.json
  ```
- 키 파일 권한을 본인만 읽을 수 있도록 제한:
  ```bash
  chmod 600 /path/to/service-account-key.json
  ```

### Step 4: (필요 시) Impersonation 설정

Domain-wide Delegation이 설정된 경우에만 필요합니다. IT팀에서 안내하지 않았다면 이 단계를 건너뛰세요.

```bash
export GOOGLE_WORKSPACE_CLI_IMPERSONATED_USER=user@company.com
```

### Step 5: MCP 등록

```bash
claude mcp add google-workspace --transport stdio -- gws mcp -s drive,gmail,calendar
```

서비스 목록은 아래 [서비스 선택 가이드](#서비스-선택-가이드)를 참고하여 필요에 따라 조정하세요.

### Step 6: 검증

Claude를 실행하고 다음을 입력합니다:

```
Google Drive 최근 파일 목록 보여줘
```

파일 목록이 표시되면 설정 완료입니다.

---

## Path B: Self-Managed (수동 OAuth) — ~45분

IT 지원 없이 직접 설정하는 경우.

### Step 1: GCP Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 (또는 기존 프로젝트 선택)
3. **"API 및 서비스" → "라이브러리"**에서 필요한 API 활성화:
   - Google Drive API
   - Gmail API
   - Google Calendar API
   - Google Docs API
   - Google Sheets API
4. **"OAuth 동의 화면"** 설정:
   - User Type: **Internal** (조직 사용자만 접근 가능)
   - 앱 이름, 지원 이메일 입력
   - 스코프는 기본값 유지 (gws가 필요한 스코프를 런타임에 요청)
5. **"사용자 인증 정보" → "사용자 인증 정보 만들기" → "OAuth 클라이언트 ID"**:
   - 애플리케이션 유형: **데스크톱 앱**
   - 생성 후 **JSON 다운로드** 클릭

### Step 2: 클라이언트 시크릿 배치

다운로드한 JSON 파일을 gws가 인식하는 위치로 이동합니다.

**Mac / Linux**:

```bash
mkdir -p ~/.config/gws
mv ~/Downloads/client_secret_*.json ~/.config/gws/client_secret.json
```

**Windows**:

```cmd
mkdir %USERPROFILE%\.config\gws
move %USERPROFILE%\Downloads\client_secret_*.json %USERPROFILE%\.config\gws\client_secret.json
```

### Step 3: gws 설치 + 인증

```bash
npm install -g @googleworkspace/cli
gws auth login
```

`gws auth login` 실행 시 브라우저가 열리며 Google 계정 OAuth 승인 화면이 표시됩니다. 승인을 완료하면 터미널에 성공 메시지가 출력됩니다.

> **참고**: `gws auth setup`은 gcloud CLI가 필요합니다. gcloud가 설치되어 있지 않다면 `gws auth login`을 사용하세요.

### Step 4: MCP 등록

```bash
claude mcp add google-workspace --transport stdio -- gws mcp -s drive,gmail,calendar
```

서비스 목록은 아래 [서비스 선택 가이드](#서비스-선택-가이드)를 참고하여 필요에 따라 조정하세요.

### Step 5: 검증

Claude를 실행하고 다음을 입력합니다:

```
Google Drive 최근 파일 목록 보여줘
```

파일 목록이 표시되면 설정 완료입니다.

---

## 서비스 선택 가이드

`-s` 플래그로 Claude에 노출할 서비스를 지정합니다. 쉼표로 구분합니다.

| 서비스 | `-s` 값 | 도구 수 (약) | 용도 |
|--------|---------|-------------|------|
| Drive | `drive` | ~30 | 파일 검색, 업로드, 공유 |
| Gmail | `gmail` | ~20 | 이메일 읽기, 전송, 검색 |
| Calendar | `calendar` | ~15 | 일정 조회, 생성, 초대 |
| Docs | `docs` | ~15 | 문서 읽기, 편집 |
| Sheets | `sheets` | ~20 | 스프레드시트 조작 |
| Chat | `chat` | ~10 | 메시지, 스페이스 관리 |
| Admin | `admin` | ~80 | 사용자/그룹 관리 (관리자 전용) |

**권장 기본 세트** (일반 업무):

```bash
gws mcp -s drive,gmail,calendar,docs,sheets
```

**전체 서비스**:

```bash
gws mcp -s all
```

> **도구 수 과다 주의**: `-s all` 사용 시 도구 수가 Claude의 tool limit (~100)에 근접할 수 있습니다. 필요한 서비스만 선택하는 것을 권장합니다.

> **중요**: `-s` 플래그는 Claude에 노출되는 **도구만** 필터링합니다. OAuth 스코프 자체를 제한하지 않습니다. 스코프를 조직 수준에서 제한하려면 IT Admin이 Domain-wide Delegation 설정에서 직접 관리해야 합니다. 자세한 내용은 `references/admin-guide.md`를 참조하세요.

---

## Troubleshooting

| 증상 | 원인 | 해결 |
|------|------|------|
| `npm: command not found` | Node.js 미설치 | <https://nodejs.org> 에서 LTS 설치 후 터미널 재시작 |
| `gws: command not found` | 글로벌 설치 안 됨 | `npm install -g @googleworkspace/cli` 재실행 |
| `invalid_scope` | 필요 API 미활성화 | GCP Console → API 라이브러리에서 해당 API 활성화 |
| `access_denied` | OAuth 동의 화면 미설정 | GCP Console → OAuth 동의 화면을 Internal로 생성 |
| `CREDENTIALS_FILE not found` | 환경변수 경로 오류 | 파일 존재 여부 확인, **절대 경로** 사용 |
| MCP 연결 후 도구 없음 | `-s` 서비스 미지정 | `-s drive,gmail` 등 서비스 명시 |
| `EACCES` permission error | npm 글로벌 권한 부족 | `sudo npm install -g` (Mac/Linux) 또는 관리자 권한 터미널 (Windows) |
| 브라우저가 열리지 않음 | 헤드리스 환경 | `gws auth login` 출력 URL을 수동으로 브라우저에 붙여넣기 |

---

## Fallback

gws가 동작하지 않는 경우:

1. 위 Troubleshooting 표를 먼저 확인
2. `gws --version`으로 설치 상태 확인
3. `gws auth status`로 인증 상태 확인
4. 해결되지 않으면 IT팀에 문의

대안 MCP 서버가 존재하나, 현재 `gws`가 Google Workspace 전체 API를 단일 패키지로 지원하는 가장 포괄적인 솔루션입니다.
