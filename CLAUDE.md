# 비개발자 하네스 (Domain Expert Harness for Claude Code)

비개발자(도메인 전문가)가 Claude Code를 자기 워크플로우에 맞춰 운용하기 위한 하네스 레포. 본 레포 자체가 하나의 작동 사례이며, 사용자는 fork 또는 clone 후 자기 도메인 자료를 채워 사용한다. 설계 가설과 시각화는 [`README.md`](./README.md) 참조.

@rules/content-writing.md
@rules/naming.md
@rules/binary-files.md
@rules/qms-sop.md
@rules/workflow.md
@rules/handoff.md
@rules/session-entry.md

## 정체성 — 3축 + 입출력 공용 채널

| 축 | 정의 | 핵심 자산 |
|---|------|----------|
| **1축 입력** | 기존 지식을 AI 인식 가능한 형태로 전환 | `rules/`, `refs/`, `wiki/pages/`, `prompts/`, `CLAUDE.md`, `.claude/hooks/`, `skill + wiki 페어` (예: `medical-device-ra-qa-frame`) |
| **2축 출력** | AI 산출물을 사람이 받는 형식으로 변환 | `.claude/skills/{docx, pdf, pdf-to-md}`, `tools/presentation/` 하네스 |
| **3축 맥락 유지** | 세션 간 맥락 보존과 복리 축적 | `.claude/skills/{wrap, repo-cleanup, council, deliverable-review, skill-creator, check-harness, check-harness-context-first}`, `.claude/agents/*`, `wiki/raw/sessions/` (seCall 자동 수집), `wiki/wiki/projects·sessions/` (codex 1차 정리) |
| **입출력 공용 채널** (1축과 2축에 걸침) | 입력과 출력 양쪽에서 쓰는 도구 | `.mcp.json` MCP 서버, `gws-setup` (Google Workspace) |

비개발자 하네스의 핵심은 **구조와 맥락을 미리 고정해두면 짧은 요청도 LLM이 스스로 처리한다**는 점이다. 대화 세션이 seCall과 codex 파이프라인을 통해 자동 아카이빙되어 다음 세션의 참고 재료가 되므로, 매 세션은 이전 세션 위에 복리로 쌓인다.

## 폴더 구조

```
.
├── CLAUDE.md             ← 본 파일 (하네스 운영 지침, LLM 자동 로드)
├── README.md             ← 가설·경험·3축 시각화·전체 workflow
├── LICENSE               ← MIT
├── .mcp.json             ← MCP 서버 (입출력 공용 채널)
├── .claude/
│   ├── settings.json     ← hook 등록
│   ├── skills/           ← 13종 (3축 분포 + medical-device-ra-qa-frame 페어 사례 + check-harness-context-first 파생)
│   ├── agents/           ← 13종 (검증·메타 reviewer, strategist·critic·narrator, context-first-auditor 등)
│   └── hooks/            ← 운영 4종 (session-start-handoff-scan · session-start-context-inject · wiki-check · block-template-write) + 테스트 1종
├── .harness/             ← check-harness-context-first 진단 리포트 저장소 (`check-reports/<날짜>-<scope>/`)
├── rules/                ← 행동 규칙 7개 (@import로 자동 로드, INDEX.md 카탈로그)
├── refs/                 ← 정적 지식 (FDA 3계층 153건: statute 117 · regulation 35 · guidance 1 sample)
├── wiki/                 ← 동적 지식 (5 layers: sources·pages·raw/sessions·wiki/projects·sessions·schema)
├── prompts/              ← LLM 운영 프롬프트 fragment
├── tools/                ← 운영 자동화 도구
│   ├── generate-weights-png.py           # README 가중치 막대그래프 재생성
│   └── presentation/     # 프레젠테이션 생성 하네스 (4 stage-owner SKILL + 9 agent, 템플릿/자유 A/B 모드)
├── assets/               ← README 이미지 (hero.jpg, weights.png)
└── memory/               ← Claude Code auto-memory placeholder (실 메모리는 `~/.claude/projects/<id>/memory/`에 저장, 본 폴더는 fork 후 사용자가 채움)
```

## skill + wiki 페어 패턴

비개발자 thinking frame은 skill 단독으로 고정하지 않고 **skill + wiki page 페어**로 관리한다. 다양한 변주에 대비하기 위함이다.

- **skill**: 트리거·인덱스·HITL 영역·Red Flags (간략 골격)
- **wiki page**: thinking frame 본문 단일 소스 (살아있는 문서, 진화 가능)

본 레포의 첫 사례: `.claude/skills/medical-device-ra-qa-frame` + `wiki/pages/medical-device-ra-qa-thinking-frame.md`. 사용자가 자기 도메인 thinking frame을 추출할 때 같은 페어 구조로 고정한다.

## Wiki Convention (요약)

자세한 schema·트리거·역할 분리는 `wiki/index.md` 참조.

- **5 layers**: `sources/` (사용자 큐레이션, LLM 수정 금지) / `pages/` (LLM 박제) / `raw/sessions/YYYY-MM-DD/` (seCall 자동 수집 대화 원재료) / `wiki/projects|sessions/` (codex 파이프라인 1차 정리) / schema
- **Role separation**: 사용자 = 소싱·해석·도메인 검증 / LLM = 요약·교차 참조·filing
- **5 filing 트리거**: 교차 비교 · 신규 개념 · 종합 분석 · 의사결정 근거 · 반복 주제
- **세션 아카이빙 파이프라인**: 대화 세션 → seCall ingest → `raw/sessions/` → codex 1차 정리 → `wiki/projects·sessions/` → LLM이 `pages/` filing 시 참고. 대화 자체가 맥락 자산으로 복리 누적되는 구조
- **log.md**: 모든 wiki 활동 기록 (ingest · query · filing · lint · update)
- **Cross-references**: `[[filename]]` 형식

## refs Convention (요약)

자세한 컨벤션은 `refs/INDEX.md` 참조. FDA는 공개 서비스이므로 본 레포에 statute·regulation은 완전 수록, guidance는 494건 중 1건만 sample로 포함하여 **INDEX 드릴다운이 수백 건 중 1건에 빠르게 도달하는 방식을 시연**한다.

- Read-only 정적 지식 (규정·정책·표준 등)
- 각 폴더에 `INDEX.md` 필수 (탐색 진입점, AI Agent가 INDEX부터 참조)
- 파일명은 NFC 정규화 (macOS NFD 주의)
- 검색은 `refs/INDEX.md` → 하위 INDEX 드릴다운 → 본문 열람 순서

## MCP Servers

`.mcp.json` 참조. 기본 구성:

- **context7**: 라이브러리 문서 검색 (npm, PyPI 등)
- **sequential-thinking**: 단계별 추론
- **word**: Word 문서 생성·편집
- **hwp** (선택): 한국 한컴오피스 HWP 문서 (Windows + 한컴오피스 필수)

사용자가 자기 환경에 맞춰 추가 MCP 서버 등록 가능 (notion, slack, custom 등).

## Git Conventions

- Branch: feature branch from `main`
- Commit: conventional commit 권장 (예: `wiki(meddev): cybersecurity 페이지 추가`)
- 사용자 자기 환경·팀 컨벤션에 맞춰 자유 조정

## Environment

- **Claude Code** (CLI 또는 Web)
- **Python 3** (hooks 실행)
- **bash** (hook 실행 환경, Windows는 Git Bash 권장)
- 선택: **pandoc** (docx 변환), **playwright** (pdf 변환), **gws CLI** (Google Workspace), **uvx** (Word MCP 실행)
- 선택: **Node.js 18+** + **TypeScript 5.7+** (`tools/presentation/` 하네스 사용 시. 설치는 `cd tools/presentation && npm install && npx playwright install chromium`, 상세는 `tools/presentation/CLAUDE.md` + `tools/presentation/ENV.md` 참조)

## 사용자 시작 가이드

1. 이 레포 fork 또는 `git clone`
2. `README.md`의 workflow 시각화로 3축 구조 이해 후 환경 설치 (Claude Code, Python, bash)
3. `.mcp.json`에서 `<PATH_TO>` placeholder 자기 환경 경로로 수정 (hwp 등 선택 MCP만)
4. `wiki/sources/`와 `refs/`에 자기 도메인 자료 채우기
5. 첫 작업 시 LLM이 `medical-device-ra-qa-frame` 패턴 보고 자기 도메인 thinking frame 페어 고정 제안
6. 세션 종료 시 `wrap` 스킬로 맥락 환류, 다음 세션은 SessionStart hook(`session-start-handoff-scan` + `session-start-context-inject`)이 handoff와 lessons pointer를 자동 주입
