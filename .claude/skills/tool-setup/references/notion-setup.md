# Notion MCP 설정 가이드

## Overview

- **Notion 공식 hosted MCP**: `https://mcp.notion.com/mcp`
- **Maintainer**: Notion Inc.
- **인증**: OAuth (1회, ~5분)
- **설치 불필요** (hosted)

Notion MCP는 Claude가 Notion 워크스페이스의 페이지와 데이터베이스를 읽고 쓸 수 있게 해줍니다.
별도 소프트웨어 설치 없이 OAuth 인증만으로 연결됩니다.

---

## Option A: Hosted MCP (권장)

가장 간단한 방법. 별도 설치 없이 OAuth만 완료하면 됩니다.

### Step 1: MCP 등록

터미널에서 아래 명령어를 실행합니다:

```bash
claude mcp add notion --transport http --url https://mcp.notion.com/mcp
```

등록 확인:

```bash
claude mcp list
```

`notion` 항목이 표시되면 성공입니다.

### Step 2: OAuth 인증

1. Claude에서 Notion 관련 질문을 입력합니다 (예: "Notion에서 최근 페이지 검색해줘")
2. 브라우저에서 OAuth 승인 페이지가 자동으로 열립니다
3. Notion 계정으로 로그인합니다
4. **접근 허용할 페이지/데이터베이스를 선택**합니다
5. "Allow access" 클릭으로 승인 완료

> 전체 워크스페이스가 아닌 **필요한 페이지만 선택**하는 것을 권장합니다.

### Step 3: 검증

Claude에서 아래와 같이 입력하여 연결을 확인합니다:

```
Notion에서 최근 수정된 페이지 3개를 검색해줘
```

페이지 목록이 반환되면 설정 완료입니다.

---

## Option B: Notion Plugin

로컬에서 Notion plugin을 설치하여 사용하는 방법입니다.
특수한 환경이 아니라면 Option A를 권장합니다.

### Step 1: Plugin 설치

Claude Code에서:

```
/install-plugin notion
```

또는 터미널에서 수동 설치:

```bash
npx skills add notion
```

### Step 2: OAuth 인증

Option A의 Step 2와 동일한 OAuth 흐름을 따릅니다.

### Step 3: 검증

Option A의 Step 3과 동일합니다.

---

## Hosted MCP vs Plugin 비교

| 항목 | Hosted MCP (권장) | Plugin |
|------|-------------------|--------|
| 설치 | 불필요 | npm/npx 필요 |
| 업데이트 | 자동 (서버 측) | 수동 재설치 |
| 인증 | OAuth 1회 | OAuth 1회 |
| 오프라인 | 불가 | 불가 (API 의존) |
| 안정성 | Notion Inc. 관리 | 로컬 환경 의존 |
| 권장 대상 | 모든 사용자 | 특수 환경 |

---

## 접근 권한 관리

- OAuth 승인 시 **접근할 페이지를 선택**할 수 있습니다
- 전체 워크스페이스가 아닌 **필요한 페이지만 허용**하는 것을 권장합니다
- 나중에 접근 범위를 변경하려면:
  1. Notion 좌측 사이드바 → **Settings & members**
  2. **Connections** 탭 선택
  3. Claude 연결 항목에서 접근 페이지 추가/제거

> 민감한 정보가 포함된 페이지는 명시적으로 허용하지 않는 한 Claude가 접근할 수 없습니다.

---

## Troubleshooting

| 증상 | 원인 | 해결 |
|------|------|------|
| OAuth 페이지가 열리지 않음 | 브라우저 팝업 차단 | 브라우저 팝업 허용 설정 후 재시도 |
| "접근 권한 없음" 오류 | 해당 페이지 미선택 | Notion Settings → Connections에서 페이지 추가 |
| MCP 연결 실패 | URL 오타 | `https://mcp.notion.com/mcp` 정확히 입력 확인 |
| 검색 결과 없음 | 접근 허용 페이지에 미포함 | Connections에서 해당 페이지를 접근 허용에 추가 |
| "MCP server not found" | MCP 미등록 | `claude mcp add` 명령어 재실행 |
| OAuth 토큰 만료 | 장기간 미사용 | Connections에서 연결 해제 후 재인증 |

---

## 참고 사항

- Notion MCP는 **읽기와 쓰기 모두 지원**합니다 (페이지 생성, 수정, 검색, 댓글 등)
- API rate limit은 Notion 공식 제한을 따릅니다 (초당 3회 요청)
- 토큰은 로컬에 안전하게 저장되며, `claude mcp remove notion`으로 연결을 해제할 수 있습니다
