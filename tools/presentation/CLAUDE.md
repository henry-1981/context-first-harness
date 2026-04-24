# Presentation Project

## 현재 상태 (v2.0 — 2026-04-21)

단일 오케스트레이터 → 4 stage-owner 스킬(plan/design/export/run) 분리 + verifier 4종(outline/sample/deck/export) + state.json 파이프라인 상태 관리 도입.

## 운영 규율

`tools/presentation/`은 상시 운영 인프라다. 수정 시 feature branch에서 작업한 뒤 main으로 병합한다.

## 핵심 원칙

1. **템플릿 모드** — 디자인 판단 = 0. 기본 템플릿이 100%, LLM은 `{{데이터}}` 치환만
2. **자유 모드** — CSS 완전 자유. outline(메시지 설계)만 공유
3. **A/B 테스트** — 비교 HTML 1장 + 브라우저 자동 오픈 → 사용자가 모드 선택 → 풀 덱
4. **3단 고정 구조** — 헤더 | 콘텐츠 | 푸터. 공간 활용 최대화
5. **단일 HTML 완결성** — 1파일 = 구조+스타일+슬롯 전부
6. **웹 표준 스케일** — 960×540에서 CSS 작성, scale(2)로 1920×1080 출력 (템플릿 모드)

## 하네스 구조

```
tools/presentation/
├── CLAUDE.md                          ← this file
├── .claude/
│   ├── CLAUDE.md                      # 하네스 설명
│   ├── agents/
│   │   ├── storyteller.md             — 편집자: 소스를 분량에 맞춰 나누고 원문 배치
│   │   ├── template-filler.md         — 템플릿 {{KEY}} 데이터 생성
│   │   ├── visual-designer.md         — PPTX 자유 모드 HTML 슬라이드
│   │   ├── webppt-designer.md         — WebPPT 전용 (모션+풀CSS, PPTX 불가)
│   │   ├── deck-verifier.md           — 풀 덱 품질 검증 (메시지+규격+AI Slop+모션)
│   │   ├── outline-verifier.md        — outline 구조·슬라이드 수·섹션 검증
│   │   ├── sample-verifier.md         — A/B 샘플 수·PNG·direction·ab_compare 검증
│   │   ├── export-verifier.md         — 포맷 파일 존재·슬라이드 수·포맷 유효성 검증
│   │   └── _contracts/                — verifier return JSON Schema + fixtures
│   ├── lib/                           — state-manager, schema-loader, aql-sampler, token-estimator
│   └── skills/
│       └── presentation/
│           ├── plan/SKILL.md          — 기획 stage-owner (P0~P4)
│           ├── design/SKILL.md        — 디자인 stage-owner (P5~P7)
│           ├── export/SKILL.md        — 내보내기 stage-owner (P8~P9)
│           └── run/SKILL.md           — E2E 메타 스킬 (plan→design→export)
├── base-templates/                 ← 템플릿 시스템
│   ├── design-system.md               # 디자인 토큰
│   ├── templates/                     # 880px 카드 템플릿
│   ├── templates-slide-warm/               # warm 슬라이드 템플릿 6종
│   ├── templates-slide-healthcare/    # healthcare-soft 슬라이드 템플릿 6종
│   ├── generate-test.ts               # 카드 이미지 생성
│   └── generate-deck.ts              # 슬라이드 덱 생성 (template-filler 출력 소비)
├── tools/slides-grab/                 ← 슬라이드 뷰어/캡처
├── scripts/                           ← build-webppt 등 출력 스크립트
├── {PPT_WORKSPACE_ROOT}/{project}/    ← 프로젝트별 격리 폴더
│       ├── state.json                 # 파이프라인 상태 (plan/design/export)
│       ├── input/input.md
│       ├── draft/outline.md
│       ├── draft/deck-data.json
│       ├── draft/slides/              # 현재 풀 덱 HTML
│       ├── checkpoints/               # 복원 지점
│       ├── samples/a/slides/          # 템플릿/자유 샘플 A
│       ├── samples/b/slides/          # 템플릿/자유 샘플 B
│       ├── samples/a/slide-*.png      # A/B 캡처 이미지
│       ├── samples/b/slide-*.png
│       ├── samples/compare.html
│       ├── logs/hooks.jsonl           # ab_compare_opened 등 hook 이벤트
│       ├── export/                    # WebPPT/PPTX/PDF
│       └── verify/                    # plan.md / design.md / export.md 검증 리포트
└── _archive/                          ← 레거시 산출물·작업폴더 참조용 보관
    └── legacy-workspaces/             ← 이전 `_workspace*` 스냅샷 보관
```

## 워크플로우 요약

```
[presentation:plan — P0~P4]
P0: 프로젝트 폴더 + state.json 초기화
P1: 입력 수집 + 모드(PPTX/WebPPT) + Aesthetic Direction + source.classification
P2: storyteller(outline) → outline-verifier → 🚧 사용자 승인
P3: A/B 샘플 생성 (모드별 분기)
  PPTX 모드  ──┬── template-filler (2장)   PNG 캡처 → samples/compare.html
               └── visual-designer (2장)
  WebPPT 모드 ──── webppt-designer × 2
          → sample-verifier → 브라우저 자동 오픈
P4: 🚧 사용자 선택 (A/B) → plan.status = "passed"

[presentation:design — P5~P7]
P5: 선택된 producer → 풀 덱 생성 (draft/slides/slide-*.html)
P6: deck-verifier 루프 (최대 2회 재시도)
P6-B: 🚧 사용자 에디터 사용 여부 (Y/n)
P7: slides-grab 에디터 → 🚧 사용자 "완료" 선언 → design.status = "passed"

[presentation:export — P8~P9]
P8: 🚧 사용자 포맷 선택 (PPTX 모드: WebPPT/PPTX/PDF | WebPPT 모드: WebPPT/PDF)
P8-B: 포맷별 변환 실행
P8-C: export-verifier
P9: 결과 파일 자동 오픈 → export.verifiers.export.status = "passed"
```

## 새 디자인 타입 추가 규칙

- LLM 자체 판단으로 디자인 생성 금지 (템플릿 모드)
- 반드시 레퍼런스(스크린샷, URL, 기존 자료) 제공 → CSS 정확히 클론
- 클론한 결과를 `{{PLACEHOLDER}}` 템플릿화

### slides-grab 에디터 (Layer 1/2 복원 v1 — Chunk 5)

- **Layer 1 (inline 편집)**: iframe 내부 텍스트 요소 더블클릭 → `contenteditable=true` 활성화 → Bold/Italic/Align 버튼이 `execCommand`로 스타일 적용
- **Layer 2 (AI 편집)**: `POST /api/edit/ai` 엔드포인트로 `PPT_EDIT_ENGINE={codex|claude}` 엔진 spawn. upstream `editor-codex-edit` 경로 이식
- **기동**: `bash tools/slides-grab/start.sh <port> <slides-dir> [state-path]`. state-path 미지정 시 slides-dir에서 climb
- **종료**: `bash tools/slides-grab/stop.sh <port>`. SIGTERM → 3초 → SIGKILL (Windows 3함정 대응)
- **save endpoint 부수효과**: 모든 save(manual + AI)는 `PPT_STATE_PATH`가 가리키는 state.json의 `design.editor_history[]`에 `editor_save` 이벤트 append

## 캡처 설정

### 카드 이미지 (블로그/SNS용)
- viewport: `{ width: 960, height: 540 }`, `deviceScaleFactor: 2`
- `.card` 요소 스크린샷 → 1760px 너비 PNG

### 슬라이드 (프레젠테이션용)
- 템플릿 모드: `.slide` 960×540, `transform: scale(2)` → 1920×1080
- 자유 모드: body 1920×1080, JS viewport scaling
- 전체 viewport 캡처 → 1920×1080 PNG

### WebPPT → PDF Export
Playwright 슬라이드별 스크린샷 → landscape PDF 합성.

## 디자인 피드백 규칙 (사용자 확정)

- **디자인 자체 판단 금지** — 반드시 레퍼런스 모방으로만 수행
- **"클론해와라" = cp -r** — 자체 재구현 금지, 원본 그대로 복사
- **폰트/레이아웃 미세 조정 금지** — 부분 수정 대신 전체 밸런스 기준 재설계
- **비대칭 비선호** — 중앙 정렬·균형 선호, 다크+세리프 비선호
- **기본 좌정렬, 요청 시 중앙정렬** — `.centered` 클래스로 전환

## 버전 이력

| 버전 | 날짜 | 접근 | 결과 |
|------|------|------|------|
| v0.4 | 03-26 | 8종 아키타입 + Agent Pipeline | LLM 생성 품질 불안정 |
| v0.5 | 03-27 | Hybrid Layout Engine + Skeleton 강제 | 매크로 해결, 마이크로 미해결 |
| v0.6 | 03-30 | 기본 템플릿 시스템 (템플릿 강제 + 데이터 치환) | **첫 만족할만한 품질** |
| v0.7 | 03-31 | 하네스 재구성 (A/B 테스트 + 5에이전트 파이프라인) | 구조 완성, 테스트 필요 |
| v0.8 | 04-02 | coach 제거, slides-grab 재배치, 포맷 선택 내보내기 | v0.7 테스트 피드백 반영 |
| v0.9 | 04-03 | Phase 0 아카이브, A/B PNG 캡처, MD 재편집 워크플로우 | 파이프라인 안정성 |
| v1.0 | 04-04 | 디자인 품질 규칙 증류 (13개 레퍼런스 → 에이전트 직접 삽입) | visual-designer + deck-reviewer 강화 |
| v1.1 | 04-04 | WebPPT 모드 신설 + 디자인 규칙 강화 (design-refs 원본 코드 증류) | 모션 시스템, Aesthetic Direction, AI Slop 강화 |
| v2.0 | 04-21 | 단일 오케스트레이터 → 4 stage-owner 스킬 + verifier 4종 + state.json | HARD-GATE 파이프라인, AQL 샘플링, pre-flight 토큰 gate |

### 핵심 교훈
- LLM 디자인 자유 = 품질 편차. 자유 제거 = 품질 일정.
- 헤더/푸터 고정 → 콘텐츠 영역 결정론적 → 공간 활용 최대화.
- 템플릿(바닥 보장) + 자유(천장 도전) A/B로 양쪽의 장점 활용.

## 공통 규율 (Agent 참조용)

본 섹션은 presentation 하네스의 모든 agent(producer·verifier)가 준수해야 하는 4가지 공통 규율의 단일 소스다. 각 agent 페르소나(`.claude/agents/*.md`)는 본 섹션을 참조만 하고 중복 서술하지 않는다. 규율이 바뀌면 본 섹션 한 곳만 수정한다.

### 규율 1: 자율 실행 금지

Agent는 브라우저를 오픈하거나 slides-grab 에디터를 실행하지 않는다. Playwright 렌더링 캡처는 `visual-designer`의 Self-Check 프로토콜에 한해 허용되며, 그 외의 브라우저·에디터 실행 권한은 오케스트레이터(`presentation:run` 또는 사용자 직접 호출 skill)에 집중된다.

근거: 과거 세션에서 visual-designer가 슬라이드마다 `start ""`를 자율 실행하여 에디터가 4회 중복 기동된 사례.

### 규율 2: 원문 보존

소스 파일(`input/input.md`)의 문장은 재작성·paraphrase 금지. Agent는 원문 그대로 가져오거나, 요약·발췌한다. "더 나은 카피"로 다듬는 행위 금지. 이는 takeaway 뿐 아니라 본문·제목 모든 필드에 적용된다.

예외: `source.classification == "topic"` (주제 문자열만 주어진 경우)에서 storyteller의 작가 모드에만 적용 완화. 그 외 `prepared`·`raw` 분류에서는 예외 없음.

근거: 과거 세션에서 storyteller paraphrase가 발생한 사례, Research Agent가 가공 콘텐츠에 raw 프레임을 투영한 사례.

### 규율 3: AI Slop 금지

아래 표현·패턴을 사용하지 않는다. 생성 시점에 회피하고, 사후 탐지는 deck-verifier가 수행한다.

- 번역투: "~에 의해/~에 대해/~에 있어서/~을 통해/~로부터/~함으로써"
- 공허 수식어: "강력한/획기적인/완벽하게/원활하게/포괄적인/종합적인/체계적인/효율적인"
- AI 도입부: "오늘날의 급변하는/디지털 시대에는/이 글에서는 X에 대해 알아보겠습니다/~의 중요성은 아무리 강조해도 지나치지 않습니다"
- 시각 AI Slop(이미지·CSS): 보라+흰 그라디언트, AI Purple(#A855F7 계열), 사이안 온 다크, 그래디언트 텍스트, 이모지 남발
- 금지 어휘: 박제, 환류, 지렛대, 이주 (이 레포의 voice 지정 예시 — fork 시 자기 금지 목록으로 교체)

상세 목록은 `rules/content-writing.md` 참조(레포 전역 규칙). 본 §공통 규율은 presentation 도메인 한정 요약.

### 규율 4: 후처리 불가

생성된 HTML/CSS의 폰트·레이아웃·색상 후처리 패칭 금지. "생성 시점에 올바르게" 원칙. sed/python으로 HTML 일괄 수정 불가. 실패 시 해당 slide를 재생성한다.

근거: 과거 세션에서 폰트 후처리 스케일링이 캔버스 넘침을 유발한 사례.

### 규율 5: 증거 의무

모든 판정·선택에 증거 경로를 명시한다. Agent return JSON에 다음 필드 중 하나 이상 포함:

- 파일 경로: `"evidence": "input/input.md:15-28"` (라인 범위)
- 인용: `"quote": "원문 30자 이내"` (5~30자)
- 스크린샷: `"screenshot": "_self_check/slide-03.png"` (Playwright 캡처)

증거 없는 판정은 호출 stage-owner 스킬이 자동 WARN으로 처리하며 PASS로 상신하지 않는다.
