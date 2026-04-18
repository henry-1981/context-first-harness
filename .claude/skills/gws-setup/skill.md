---
name: gws-setup
description: Use when installing or setting up Google Workspace CLI (gws). Triggers on "gws 설치", "gws setup", "Google Workspace CLI", "gws 세팅", "gws auth", "구글 워크스페이스 CLI". Distinguishes Admin (one-time GCP project setup) vs User (browser-based authentication only).
---

# gws-setup

Google Workspace CLI (`gws`) 설치 및 인증 가이드. 조직(회사·팀·교육기관·비영리 등) 단위로 적용.

## 핵심 패턴 — 1인 Admin → N인 User

이 skill의 가치는 **조직 내 1인(Admin)이 GCP 프로젝트·OAuth client·IAM 바인딩을 한 번만 세팅하면, 나머지 구성원(User)은 1분 인증만으로 합류**할 수 있다는 점입니다. 비개발자 조직에서 한 명이 ladder를 만들면 N명이 그 ladder를 타고 올라오는 패턴의 대표 사례 — 본 하네스 레포의 메타 정신과 동일합니다.

## Role Detection

Ask user which role applies:

- **Admin**: GCP 프로젝트·OAuth 클라이언트 최초 생성, API 활성화, 도메인 IAM 바인딩. → [Admin Setup](#admin-setup)
- **User**: 이미 생성된 조직 공용 프로젝트의 `client_secret.json`을 받아 인증만 수행. → [User Setup](#user-setup)

대부분 구성원은 **User** role. Admin setup은 조직당 **1회만** 수행하면 됩니다.

---

## User Setup

### Step 1: OS Detection & Binary Install

Detect OS automatically via runtime check, then install.

**Windows (직접 다운로드):**
```bash
# Check if already installed
gws --version

# Install via direct binary download
# 1. Download from https://github.com/googleworkspace/cli/releases
#    → google-workspace-cli-x86_64-pc-windows-msvc.zip
# 2. Verify checksum
sha256sum <downloaded-zip>  # compare with .sha256 file
# 3. Extract to ~/tools/gws/
mkdir -p ~/tools/gws && unzip <downloaded-zip> -d ~/tools/gws/
# 4. Add to user PATH (PowerShell)
powershell -NoProfile -Command "[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path','User') + ';C:\Users\<USER>\tools\gws', 'User')"
# 5. Verify
~/tools/gws/gws.exe --version
```

**macOS (Homebrew):**
```bash
brew install googleworkspace-cli
gws --version
```

### Step 2: Place client_secret.json

조직 내 Admin이 공유 위치(공유 Drive·Slack·내부 위키 등)에 배포한 `client_secret.json`을 다운로드.

```bash
mkdir -p ~/.config/gws
cp <downloaded-file> ~/.config/gws/client_secret.json
```

접근 불가 시: 조직 Admin에게 공유 위치 접근 권한을 요청하세요.

### Step 3: Authenticate

```bash
gws auth login -s drive,calendar,sheets,slides,docs,forms,chat.spaces,chat.messages
```

Browser opens → select Google account → approve permissions.

**Common prompts:**
- Scope checkboxes → **Select all** → **Continue**
- If browser doesn't open automatically, copy the URL printed in terminal and paste into browser

### Step 4: Verify

```bash
gws drive files list --params '{"pageSize": 3}'
```

Should return JSON with file list. If error:
- `exit code 2` (auth error): rerun `gws auth login`
- `accessNotConfigured`: API not enabled — report to Admin

### Step 5: Enable Meet Scope (Optional)

Meet requires separate auth due to scope limits:
```bash
gws auth login -s meet
```

---

## Admin Setup

조직당 1회 setup. `gcloud` CLI 필요.

### Step 1: Install gcloud CLI

**Windows:**
```powershell
winget install --id Google.CloudSDK --accept-source-agreements --accept-package-agreements --silent
```

**macOS:**
```bash
brew install --cask google-cloud-sdk
```

Verify: `gcloud --version`

### Step 2: Authenticate & Create Project

```bash
gcloud auth login
gcloud projects create <YOUR-PROJECT-ID> --name="<Your Org> Workspace CLI"
gcloud config set project <YOUR-PROJECT-ID>
```

`<YOUR-PROJECT-ID>` 는 조직 식별 가능한 짧은 ID로 정합니다 (예: `acme-gws`, `myteam-workspace-cli`, `edu-research-gws`).

이미 프로젝트가 있다면 set만:
```bash
gcloud config set project <YOUR-PROJECT-ID>
```

### Step 3: Enable APIs

```bash
gcloud services enable \
  drive.googleapis.com \
  calendar-json.googleapis.com \
  sheets.googleapis.com \
  slides.googleapis.com \
  docs.googleapis.com \
  forms.googleapis.com \
  meet.googleapis.com \
  chat.googleapis.com \
  --project=<YOUR-PROJECT-ID>
```

No billing required — Workspace APIs use user's own quota.

### Step 4: OAuth Consent Screen

브라우저:
```
https://console.cloud.google.com/apis/credentials/consent?project=<YOUR-PROJECT-ID>
```

Configure:
1. **User Type**:
   - **Internal** (Google Workspace 조직 가입자만 사용 — 도메인 전체 자동 허용, test user 등록 불필요, 인증 경고 없음). 조직 운영 시 권장.
   - **External** (개인 Gmail 또는 Workspace 외부 사용자도 허용 — test user 등록 필요, 100명까지 미검토 앱)
2. **App name**: `<Your Org> gws CLI`
3. **User support email**: admin's email
4. **Developer contact email**: admin's email
5. Save and Continue (Scopes는 skip)
6. Save

### Step 5: Create OAuth Desktop Client

브라우저:
```
https://console.cloud.google.com/apis/credentials?project=<YOUR-PROJECT-ID>
```

1. **+ CREATE CREDENTIALS** → **OAuth client ID**
2. **Application type**: `Desktop app` (NOT Web application)
3. **Name**: `gws CLI`
4. **CREATE**
5. **DOWNLOAD JSON** → save as `client_secret.json`

### Step 6: Grant Domain-wide IAM Binding (Workspace Internal 운영 시)

**중요**: Internal OAuth consent만으로는 부족합니다. Google API gateway는 요청이 `<YOUR-PROJECT-ID>` 프로젝트 쿼터로 흘러갈 때 IAM 레이어에서 `serviceusage.serviceUsageConsumer` 권한을 따로 체크합니다. Project Owner는 자동 통과하지만 일반 구성원은 명시적으로 받아야 API 호출이 성공합니다. 이 단계를 빼면 구성원이 `gws auth login`은 통과해도 실제 API 호출에서 403이 터집니다.

도메인 전체에 한 번만 부여하면 이후 모든 조직 구성원이 자동 통과합니다:

```bash
gcloud projects add-iam-policy-binding <YOUR-PROJECT-ID> --member="domain:<your-domain>" --role="roles/serviceusage.serviceUsageConsumer"
```

한 줄로 실행하세요. 여러 줄(`\` line continuation)로 복사하면 Git Bash에서 단어가 쪼개져 `unrecognized arguments` 에러가 납니다.

**대안 (UI):** `https://console.cloud.google.com/iam-admin/iam?project=<YOUR-PROJECT-ID>` → **+ GRANT ACCESS** → New principals에 `<your-domain>` 입력 후 드롭다운에서 **Domain: <your-domain>** 선택 → Role: `Service Usage Consumer` → SAVE.

도메인 옵션이 UI 드롭다운에 안 뜨거나 CLI에서 "Policy members of type `domain` are not supported" 에러 시 = Workspace 조직이 GCP에 Organization으로 연결돼 있지 않은 상태. 이 경우 개인별 부여로 폴백:

```bash
gcloud projects add-iam-policy-binding <YOUR-PROJECT-ID> --member="user:member@<your-domain>" --role="roles/serviceusage.serviceUsageConsumer"
```

External 운영(개인 Gmail 포함)이면 Step 6 자체가 불필요합니다 — OAuth consent의 test user 등록만으로 충분합니다.

### Step 7: Distribute client_secret.json

조직 내 공유 위치(공유 Drive·Slack 채널·내부 위키 등)에 `client_secret.json`을 배포합니다.

OAuth Desktop client_secret은 "public client" credential (Google's design) — 조직 내 배포는 안전합니다. Security는 secret 자체가 아니라 각 사용자의 browser-based consent에서 옵니다.

### Step 8: New Members

Step 6 도메인 IAM 바인딩이 걸려 있으면, 신규 구성원은 별도 등록 없이 즉시 사용 가능합니다. 안내할 내용은 두 가지:

1. 공유 위치에서 `client_secret.json` 다운로드 권한 부여
2. User Setup 섹션(Step 1~4) 따라하도록 가이드

도메인 바인딩 대신 개인별 부여로 운영 중이라면, 구성원 추가 시마다 Step 6의 개인별 부여 명령을 한 번씩 실행해야 합니다.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Access blocked" / 403 on login | 조직 도메인 계정이 아님 | 조직 Google Workspace 계정으로 로그인 |
| 403 on API call / `PERMISSION_DENIED: serviceusage.services.use` | 프로젝트 IAM에 `serviceUsageConsumer` 없음 (OAuth consent는 통과해도 IAM 레이어에서 막힘) | Admin runs Admin Setup **Step 6** (도메인 바인딩) |
| User 안내 문구 "권한 요청: `roles/serviceusage.serviceUsageConsumer`" | 동일 — IAM 바인딩 누락 | 동일 — 도메인 단위로 한 번만 부여하면 됨 |
| `accessNotConfigured` | API not enabled on project | Admin runs `gcloud services enable <api>` |
| `unrecognized arguments: --member=...` on gcloud | Git Bash에서 여러 줄 복사 시 단어가 쪼개짐 | 한 줄로 실행 (Admin Step 6 참조) |
| Browser doesn't open | CLI can't launch browser | Copy URL from terminal output, paste in browser |
| `gcloud` not found after install | PATH not refreshed | Open new terminal, or add PATH manually |
| `redirect_uri_mismatch` | OAuth client type wrong | Delete client, recreate as **Desktop app** |

## Scope Reference

| Service | gws flag | Scope |
|---------|----------|-------|
| Drive | `drive` | `drive` (full access) |
| Calendar | `calendar` | `calendar` (read/write) |
| Sheets | `sheets` | `spreadsheets` |
| Slides | `slides` | `presentations` |
| Docs | `docs` | `documents` |
| Forms | `forms` | `forms` |
| Meet | `meet` | `meetings.space.created` |

## Configuration Template

조직별 설정값을 Admin이 아래 양식으로 채워 팀에 공유합니다:

- **GCP Project ID**: `<YOUR-PROJECT-ID>`
- **Admin**: `<admin@your-domain>`
- **OAuth Client Type**: Desktop app
- **OAuth Created**: `<YYYY-MM-DD>`
- **Enabled APIs**: Drive · Calendar · Sheets · Slides · Docs · Forms · Meet · Chat (+ auto-enabled dependencies)
- **IAM Binding**: `domain:<your-domain>` → `roles/serviceusage.serviceUsageConsumer` (bound `<YYYY-MM-DD>`)
- **Billing**: Not required
- **client_secret.json 공유 위치**: `<shared link or path>`
