---
name: presentation:plan
description: "프레젠테이션 기획 스킬 — 소스 수집·청중·분량 확정, outline 설계, A/B 샘플·direction 선택. 트리거: '프레젠테이션 기획', '슬라이드 outline', 'PPTX 기획', 'WebPPT 기획', '덱 plan', '프레젠테이션 재수정 내용'."
---

# presentation:plan — 기획 단계 Stage-Owner 스킬

소스 MD/URL/주제 문자열에서 출발해 outline + A/B 샘플 + mode/direction 선택까지 수행하는 기획 스킬. 본 스킬이 완료되면 `state.json`의 `plan.status = "passed"`로 전이되고, `presentation:design`이 이어받을 수 있다.

## 실행 모드

**Main thread에서 직접 실행.** 서브에이전트 `Agent()` 호출은 내부 producer(storyteller)·verifier(outline-verifier, sample-verifier) 디스패치에만 사용한다. 사용자 gate 상호작용(P2 outline 승인, P4 A/B 선택)이 본 스킬 내에 2회 있으므로 메인에서 돌려야 한다.

## Re-entry 분기 (Spec §3.2 plan 행)

스킬 진입 시 먼저 `{PPT_WORKSPACE_ROOT:-<repo-local workspace root>}/*/state.json` 파일을 glob한다.

| 발견 건수 | 처리 |
|---|---|
| 0건 | 신규 프로젝트. P0부터 시작 |
| 1건 | 해당 프로젝트 자동 선택. `plan.status` 읽어 분기 |
| 2건 이상 | 사용자에게 프로젝트 목록 제시 후 선택받기 |

`plan.status` 분기 (기존 프로젝트):

| plan.status | 처리 |
|---|---|
| `"passed"` | 내용 수정 모드. outline.md를 사용자에게 보여주고 수정 지시 수신 → P2 outline-verifier 재실행부터 진행. A/B 샘플은 skip(mode·direction 이미 확정됨) |
| `"failed"` | 마지막 실패 지점부터 재개. `history` 배열 말미의 `*_verifier_fail` 이벤트로 위치 판정 |
| `"ready"` / 미기재 | 처음부터 진행 |

state.json 부재 + `draft/outline.md`·`draft/slides/slide-*.html` 등 산출물 파일만 존재하는 레거시 프로젝트는 Spec §8.1에 따라 사용자에게 2옵션 제시: (1) state.json 수동 재구성(~5분 인터뷰) (2) 새 프로젝트 시작. 자동 마이그 없음.

## Phase P0: 프로젝트 이름 확정 + state.json 초기화

프로젝트 이름 결정:
- 레포 voice 지정 → 그대로(소문자·하이픈)
- 미지정 → 주제+날짜 자동(예: `sop-training-20260406`)
- 이후 모든 경로에서 `{project}` 변수로 사용

디렉토리 생성:

```bash
ROOT="${PPT_WORKSPACE_ROOT:-tools/presentation/_workspace}"
mkdir -p "$ROOT/{project}/input/images"
mkdir -p "$ROOT/{project}/input/references"
mkdir -p "$ROOT/{project}/draft/slides"
mkdir -p "$ROOT/{project}/checkpoints"
mkdir -p "$ROOT/{project}/samples/a/slides"
mkdir -p "$ROOT/{project}/samples/b/slides"
mkdir -p "$ROOT/{project}/export"
mkdir -p "$ROOT/{project}/verify"
mkdir -p "$ROOT/{project}/logs"
```

state.json 초기화 (state-manager.js 사용):

```bash
ROOT="${PPT_WORKSPACE_ROOT:-tools/presentation/_workspace}"
node --input-type=module -e "
import { createStateManager } from './.claude/lib/state-manager.js';
const sm = createStateManager('${ROOT}/{project}', '{project}');
await sm.initial({ sourceType: 'file', classification: 'prepared' });
"
```

## Phase P1: 입력 수집 + source 분류 + config 확정

사용자에게 수집: 소스(파일/URL/주제), 목적, 분량, 청중, 이미지 유무, 섹션 인디케이터(A/B/C, 기본 C), **출력 모드**(PPTX/WebPPT, 기본 PPTX), **Aesthetic Direction**(WebPPT 또는 PPTX 자유 모드).

Aesthetic Direction 8종: editorial-magazine / dark-tech / swiss-minimal / brutalist-raw / bento-modern / organic-soft / luxury-refined / custom. 선택 후 Differentiation("이 발표로 뭘 기억하게 하고 싶은가?") + 선택적 3-Dial(DESIGN_VARIANCE, MOTION_INTENSITY, VISUAL_DENSITY).

`input/input.md`에 저장. 동시에 state.json `source.*` + `config.*` 확정:

```js
sm.merge('{state_path}', {
  source: {
    type: '<file|url|topic>',
    path: '<원본 경로 또는 주제 문자열>',
    classification: '<prepared|raw|topic>'  // storyteller S4 대응. 사용자 선언 또는 간단 heuristic
  },
  config: {
    mode: '<pptx|webppt>',
    mode_variant: '<templateSet|free|webppt-free>',
    direction: '<editorial-magazine|...>',
    dials: { design_variance: N, motion_intensity: N, visual_density: N }
  },
  history_append: { event: 'plan_started' }
});
```

`source.classification`은 사용자에게 명시 질문: "이 소스는 (1) 이미 발표용으로 가공 완료 / (2) raw 자료 / (3) 주제 문자열만 중 어느 쪽인가?" 답을 `prepared|raw|topic`으로 저장. storyteller가 이 값을 읽어 편집자/구조화/작가 모드 분기.

## Phase P2: Outline 설계 (storyteller + outline-verifier)

### P2-1. storyteller 디스패치

```
Agent(
  subagent_type: "storyteller",
  prompt: "storyteller 에이전트로 작업하라. .claude/agents/storyteller.md를 읽고 따르라.
           입력: {project_root}/input/input.md
           출력: {project_root}/draft/outline.md
           state.json 경로: {project_root}/state.json
           source.classification: {prepared|raw|topic}
           config.mode: {pptx|webppt}
           config.mode_variant: {templateSet|free|webppt-free}
           config.direction: {선택 direction}
           returns stdout JSON per _contracts/storyteller.schema.json"
)
```

storyteller return JSON을 `_contracts/storyteller.schema.json`으로 validation(schema-loader.js). 통과 시 `plan.outline.*` 필드(slide_count_declared / slide_count_actual / slides[]) 구성용 데이터로 받는다.

### P2-2. outline-verifier 디스패치

```
Agent(
  subagent_type: "outline-verifier",
  prompt: "outline-verifier 에이전트. .claude/agents/outline-verifier.md를 읽고 따르라.
           입력: {project_root}/draft/outline.md + state.json
           출력: {project_root}/verify/plan.md (append)
           returns stdout JSON per _contracts/outline-verifier.schema.json"
)
```

verifier return JSON을 `_contracts/outline-verifier.schema.json`으로 validation. `plan.verifiers.outline`에 merge:

```js
sm.merge('{state_path}', {
  plan: {
    status: status === 'pass' ? 'ready' : 'failed',
    outline: { /* storyteller return 반영 */ },
    verifiers: { outline: { status, retries, warnings, evidence_path: 'verify/plan.md' } }
  },
  history_append: { event: `outline_verifier_${status}`, retry: <n> }
});
```

FAIL 시 재시도 상한 2회(Spec §5.2). 3차 FAIL이면 root cause 리포트 생성 후 사용자 선택 gate.

### P2-3. 사용자 outline 승인 gate

outline.md 요약을 사용자에게 제시(슬라이드 수·제목·섹션 구성). **🚧 GATE: 사용자 승인 없이 P3 진입 금지.** 수정 지시 있으면 storyteller 재호출.

## Phase P3: A/B 샘플 생성 + sample-verifier

### P3-1. 샘플 2장 병렬 생성

outline에서 표지(Slide 1) + 본문 대표 1장(Slide 3 권장) 추출. mode별 분기:

**PPTX 모드 (mode_variant별):**
- `templateSet`(A) vs `free`(B): template-filler + visual-designer 병렬. 각 `samples/a/slides/` + `samples/b/slides/`에 slide-01·slide-03만 생성
- `free` 단독: visual-designer × 2 병렬(direction A/B 비교는 WebPPT와 동일 방식)

**WebPPT 모드:**
- `webppt-free` × 2 병렬. Aesthetic Direction A/B 비교(사용자가 direction 1개만 지정했으면 LLM이 소재 적합 대안 1개 추천해 A/B 구성)

```
Agent(
  subagent_type: "template-filler|visual-designer|webppt-designer",
  prompt: "⚠️ 샘플 모드: outline의 Slide 1·3만 생성. 초과 생성 금지.
           입력: {project_root}/draft/outline.md + state.json
           출력: {project_root}/samples/{a|b}/slides/ 또는 {project_root}/draft/deck-data.json
           returns stdout JSON per _contracts/{agent}.schema.json",
  run_in_background: true
)
```

양쪽 완료 대기 후 각 return JSON validation + state.json `history`에 이벤트 append(샘플 자체는 transient이므로 plan/design sub-object 미기록).

### P3-2. PNG 캡처 + samples/compare.html 생성

Playwright screenshot CLI로 샘플 HTML을 PNG 캡처(viewport/scale은 기존 orchestrator Phase 3 표와 동일).

```bash
# 캡처
npx playwright screenshot --viewport-size="960,540" --device-scale-factor=2 "file://$(pwd)/{project_root}/samples/a/slides/slide-01.html" "{project_root}/samples/a/slide-01.png"
# (4개 캡처 반복)

# samples/compare.html 생성
# .claude/skills/presentation/plan/assets/ab-compare-template.html Read → {{LABEL_A}}·{{LABEL_B}} 치환 → {project_root}/samples/compare.html write
```

ab_compare 템플릿은 기존 orchestrator의 `assets/ab-compare-template.html`을 Task 4.6에서 신규 plan 스킬 경로로 이동.

### P3-3. samples/compare.html 브라우저 오픈 + hook log append

```bash
start "" "{project_root}/samples/compare.html"

# hook log append (본 chunk 선행 설계 §§ "hook 경로 확정" 규약 준수)
mkdir -p "{project_root}/logs"
echo "{\"ts\":\"$(date -Iseconds)\",\"event\":\"ab_compare_opened\",\"project\":\"{project}\",\"path\":\"$(pwd)/{project_root}/samples/compare.html\"}" >> "{project_root}/logs/hooks.jsonl"
```

이 log append는 sample-verifier의 `ab_compare_opened` 체크 대상.

### P3-4. sample-verifier 디스패치

```
Agent(
  subagent_type: "sample-verifier",
  prompt: "sample-verifier 에이전트. .claude/agents/sample-verifier.md를 읽고 따르라.
           입력: {project_root}/samples/{a,b}/slides/ + *.png + compare.html + logs/hooks.jsonl
           state.json config.direction: {direction} (또는 A/B 2종)
           출력: {project_root}/verify/plan.md (append)
           returns stdout JSON per _contracts/sample-verifier.schema.json"
)
```

verifier return validation 후 state.json `history_append` (샘플링은 transient, `plan.verifiers`에 별도 sample 섹션 두지 않음):

```js
sm.merge('{state_path}', {
  history_append: { event: `sample_verifier_${status}`, retry: <n> }
});
```

FAIL 시 초과분 삭제(stage-owner 책임) 또는 producer 재호출 1회.

## Phase P4: 사용자 A/B 선택

```
A/B 비교가 브라우저에 열려 있습니다.
어느 스타일로 진행할까요? (A/B)
```

⚠️ **선택지 2개만.** "전체 테스트", "더 많은 샘플" 류 수량 옵션 절대 금지(기존 orchestrator Gate 규율 승계).

**🚧 GATE: 사용자 선택 전까지 plan.status = "passed" 전이 금지.**

선택 수신 후:

```js
sm.merge('{state_path}', {
  config: { mode_variant: '<최종 확정>', direction: '<최종 확정>' },
  plan: { status: 'passed' },
  history_append: { event: 'plan_passed' }
});
```

## 스킬 체인 안내 (Spec §3.3)

plan.status = "passed" 기록 직후 사용자에게 통보:

```
plan 단계 완료. state.json plan.status = "passed".

다음 단계(풀 덱 생성 + 검증)는 `presentation:design` 스킬로 진행합니다.
- `presentation:run`으로 진입하셨다면 자동으로 이어집니다
- 개별 진입이라면 "presentation:design 시작"으로 호출하세요
```

## HARD-GATE 규율

본 스킬은 **진입 gate 없음** (항상 진입 가능, 신규 또는 기존 프로젝트 불문).

다만 P4 gate(A/B 선택)·P2 gate(outline 승인)은 사용자 응답 없이 진행 금지. gate 위반은 합리화 방어 표(기존 orchestrator 승계) 적용.

## 에러 핸들링

| 상황 | 대응 |
|---|---|
| source 파일 없음 | 사용자에게 경로 재확인 요청 |
| storyteller 2회 실패 | 3차 FAIL root cause 리포트(Spec §5.2) 생성 후 사용자 선택 gate |
| sample 초과 생성 | 초과분 shell `rm` 후 sample-verifier 재호출 1회 |
| ab_compare 브라우저 오픈 실패 | `start ""` 재시도 1회 → 그래도 실패 시 사용자에 경로 안내 후 수동 오픈 요청 |
| state.json schema validation 실패 | 해당 merge 롤백 + `history`에 `validation_fail` 기록 + 사용자 통보 |

## Gate 규율 — Red Flags (기존 orchestrator 승계)

| Red Flag | 대응 |
|---|---|
| P3에서 producer가 3장 이상 생성 | 초과분 삭제 후 sample-verifier 재호출 |
| P4에서 "전체 테스트" 또는 샘플 수량 선택지 사용자 제시 | 즉시 삭제, A/B 2 샘플 고정 |
| P4 선택 전 plan.status = "passed" 전이 | 즉시 롤백, gate 위반 |
| samples/compare.html 생성 후 브라우저 미오픈 | 반드시 `start ""` 실행 |
| Phase에 없는 preview HTML 등 즉흥 산출물 | 즉시 삭제 |
