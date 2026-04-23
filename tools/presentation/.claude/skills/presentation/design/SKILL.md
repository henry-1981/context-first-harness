---
name: presentation:design
description: "프레젠테이션 풀 덱 생성·검증·미세 수정 스킬 — 선택된 모드로 전체 슬라이드 생성, deck-verifier 루프, slides-grab 에디터. 트리거: '프레젠테이션 풀덱', '슬라이드 생성', 'PPTX 덱 생성', 'WebPPT 풀덱', '덱 미세 수정', '슬라이드 에디터'."
---

# presentation:design — 디자인 단계 Stage-Owner 스킬

plan 단계에서 확정된 mode/direction/outline으로 풀 덱을 생성하고, deck-verifier로 검증하며, slides-grab 에디터로 HB 미세 수정을 수용한다. 본 스킬이 완료되면 `design.status = "passed"`로 전이되어 `presentation:export`가 이어받는다.

## 실행 모드

**Main thread에서 직접 실행.** producer(visual-designer/webppt-designer/template-filler), verifier(deck-verifier)는 `Agent()` 서브에이전트로 호출. HB gate(P7 "완료" 선언) 상호작용이 있으므로 메인에서 돌려야 한다.

## 진입 Gate (HARD-GATE)

진입 시 먼저 `{PPT_WORKSPACE_ROOT:-<repo-local workspace root>}/*/state.json` glob. Spec §3.3 HARD-GATE 판정 기준 적용:

| 상황 | 처리 |
|---|---|
| state.json 0건 또는 `plan.status != "passed"` | **즉시 중단**. HB에게 현 status 보고 + "plan 단계를 먼저 완료하세요" 안내. `presentation:plan` 호출 지시 |
| state.json 2건 이상 | 프로젝트 목록 HB 제시 후 선택 |
| state.json 1건 + `plan.status == "passed"` | `design.status` 분기로 진입 |

`design.status` 분기:

| design.status | 처리 |
|---|---|
| 미기재 / `"ready"` | 신규 풀 덱 생성(P5부터) |
| `"passed"` | **에디터 모드 직진입**(P7만). HB에게 "기존 덱 미세 수정 모드입니다" 안내 |
| `"failed"` | 마지막 실패 지점부터 재개. `history` 배열 말미 `deck_verifier_fail` 또는 `design_fail` 이벤트로 위치 판정 |

**"이 장만 다시" 명시 요청 시 부분 재생성 모드**(D pain) — 아래 §부분 재생성 섹션.

## Phase P5: 풀 덱 생성

state.json `config.mode` + `config.mode_variant` 읽어 producer agent 분기:

| mode | mode_variant | producer | 출력 |
|---|---|---|---|
| pptx | templateSet | template-filler | `draft/deck-data.json` + `npx tsx base-templates/generate-deck.ts` → `draft/slides/*.html` |
| pptx | free | visual-designer | `draft/slides/slide-*.html` 직접 |
| webppt | webppt-free | webppt-designer | `draft/slides/slide-*.html` 직접 |

디스패치 프롬프트:

```
Agent(
  subagent_type: "<producer>",
  prompt: "⚠️ 풀 덱 모드: outline 전체를 생성.
           샘플의 디자인 시스템(samples/b/slides/의 slide-01·slide-03)을 유지.
           입력: {project_root}/draft/outline.md + state.json
           Aesthetic Direction: {config.direction}
           Differentiation: {P1에서 수집한 값}
           출력: {project_root}/draft/slides/slide-*.html (또는 {project_root}/draft/deck-data.json)
           returns stdout JSON per _contracts/{producer}.schema.json"
)
```

producer return JSON validation 후 state.json `design.slides[]` 배열 merge:

```js
sm.merge('{state_path}', {
  design: {
    status: 'ready',
    slides: [/* producer return의 slides 배열 그대로 */]
  },
  history_append: { event: 'full_deck_generated', producer: '<agent>' }
});
```

각 slide 객체는 `{ n, html_path, agent, self_check_pngs[], verifier_status: null, override_css[] }` 필수.

## Phase P6: deck-verifier iterative 루프

```
Agent(
  subagent_type: "deck-verifier",
  prompt: "deck-verifier 에이전트. .claude/agents/deck-verifier.md를 읽고 따르라.
           입력: {project_root}/draft/outline.md + draft/slides/slide-*.html + state.json
           config.mode: {pptx|webppt}
           config.mode_variant: {templateSet|free|webppt-free}
           출력: {project_root}/verify/design.md (append)
           returns stdout JSON per _contracts/deck-verifier.schema.json"
)
```

AQL 샘플링은 verifier 내부에서 수행(aql-sampler.js, lot=슬라이드 수). **Pre-flight 토큰 gate**(Spec §5.3): sample n ≥ 20이면 verifier 실행 **전** token-estimator.js로 예상 토큰 계산 후 HB confirm.

verifier return validation 후 merge:

```js
sm.merge('{state_path}', {
  design: {
    status: status === 'pass' ? 'ready' : 'failed',
    verifiers: { deck: { status, aql_sample_slides, retries, warnings, evidence_path: 'verify/design.md' } }
  },
  history_append: { event: `deck_verifier_${status}`, retry: <n> }
});
```

`deck-verifier PASS` 직후에는 현재 `draft/`를 자동 checkpoint로 저장한다. 기본 라벨은 `auto-post-deck-verifier-pass-{YYYY-MM-DD-HHMMSS}`이며, `history`에는 `checkpoint_created`가 append되어야 한다.

FAIL 처리:

| retries | 처리 |
|---|---|
| 0 → 1 | FAIL verifier의 findings에서 수정 지시 추출 → producer agent 재호출 → 재검증 |
| 1 → 2 | 동일하게 2차 재시도 |
| 2 → 3차 FAIL | Root cause 리포트 생성(Spec §5.2 5옵션 제시) → HB 선택 gate. state.json `history`에 `root_cause_report` 이벤트 append |

retries 상한 2회 고정(Spec §5.2). 자동 재시도 로직이 상한을 넘어가지 않도록 state.json `design.verifiers.deck.retries` 필드로 카운트.

## Phase P6-B: 에디터 사용 여부 HB 선택 (Spec §3.3 "(선택)" 경로)

deck-verifier PASS 확인 후 HB에게 명시 질문:

```
deck-verifier PASS. slides-grab 에디터로 미세 수정하시겠습니까? (Y/n)
- Y: 에디터 기동 후 HB "완료" 선언 시 design.status = "passed" 전이 (P7 진입)
- n: 에디터 skip, 즉시 design.status = "passed" 전이 (Spec §3.3 "(선택)" 허용)
```

**🚧 GATE: HB 응답 없이 다음 분기 진행 금지.**

응답 `n` (또는 "에디터 안 씀" 류 거절):

```js
sm.merge('{state_path}', {
  design: { status: 'passed' },
  history_append: { event: 'design_passed', editor: 'skipped' }
});
```

이후 §스킬 체인 안내로 직행, P7 skip.

응답 `Y`는 P7 진입.

## Phase P7: slides-grab 에디터 미세 수정 (P6-B에서 Y 선택 시만)

에디터 사용 확정 후 기동:

**기동 전 참조 검증 (필수)**:

```bash
ls -lt {project_root}/draft/slides/*.html | head -1  # 최근 생성 확인
[ -f {workspace_root}/slides-grab.lock ] && echo "⚠ 이전 서버 잔존" || echo "✓ Clean"
```

잔존 서버 있으면 먼저 stop 스크립트 실행.

```bash
bash tools/slides-grab/start.sh 3456 {project_root}/draft/slides
# (Chunk 5에서 Layer 1/2 복원된 에디터 서버. 현 assets/start-slides-grab.sh 경로는 Chunk 5에서 tools/slides-grab/ 하위로 재배치됨)
```

HB 안내:

```
slides-grab 에디터가 localhost:3456에서 실행 중입니다.
텍스트 수정, Bold/Italic, (Chunk 5 Layer 2 복원 시) AI 편집이 가능합니다.
슬라이드 삭제/순서 변경은 Claude Code 프롬프트로 말씀하세요(에디터 밖).
수정 완료되면 "완료"라고 알려주세요.
```

**🚧 GATE: P7 진입 시 HB "완료" 선언 없이 design.status = "passed" 전이 금지.** (P6-B에서 에디터 skip한 케이스는 이미 P6-B에서 전이 완료. P7은 진입하지 않음.)

에디터 사용 이력은 state.json `design.editor_history[]` append (Chunk 5 slides-grab 서버가 save endpoint마다 기록):

```js
// slides-grab 서버가 직접 호출(Chunk 5 task)
sm.merge('{state_path}', {
  history_append: { event: 'editor_save', slide: <n>, engine: '<manual|codex|claude>', intent: '<summary>', diff_bytes: <n> }
});
```

본 SKILL은 에디터 종료 후 최종 상태를 state.json에 반영:

```bash
bash tools/slides-grab/stop.sh 3456
```

```js
sm.merge('{state_path}', {
  design: { status: 'passed' },
  history_append: { event: 'design_passed', editor: 'used' }
});
```

## 부분 재생성 모드 (D pain)

HB가 "slide-05만 다시 생성해줘" 류 요청 시:

1. state.json 읽어 해당 slide의 producer agent 식별 (`design.slides[n-1].agent`)
2. 해당 producer 재호출, **해당 slide만** 생성
3. 기존 파일 덮어쓰기(`draft/slides/slide-05.html`)
4. deck-verifier를 **해당 slide만** 대상으로 재호출(AQL 샘플 강제: `[5]`)
5. PASS 시 `design.slides[4]` 필드 갱신 + `history_append: { event: 'partial_regen', slide: 5 }`

부분 재생성은 design.status 전이 없이 수행(이미 passed였어도 유지). HB가 추가 에디터 수정 원하면 P7로, 바로 export 원하면 `presentation:export` 호출.

## 스킬 체인 안내

design.status = "passed" 기록 직후:

```
design 단계 완료. state.json design.status = "passed".

다음 단계(포맷 내보내기)는 `presentation:export` 스킬로 진행합니다.
- `presentation:run`으로 진입하셨다면 자동으로 이어집니다
- 개별 진입이라면 "presentation:export 시작"으로 호출하세요
```

## 에러 핸들링

| 상황 | 대응 |
|---|---|
| 진입 시 `plan.status != "passed"` | 즉시 중단, HB에 plan 선행 안내 |
| producer 1회 실패 | 재호출 1회 → 재실패 시 해당 slide skip + findings 기록 |
| deck-verifier 3차 FAIL | Root cause 리포트 + HB 선택 gate (Spec §5.2 5옵션) |
| slides-grab 포트 점유 | stop 스크립트 실행 후 재기동, 그래도 실패 시 다른 포트 할당 |
| state.json schema validation 실패 | merge 롤백 + `validation_fail` 이벤트 + HB 통보 |

## Gate 규율 — Red Flags

| Red Flag | 대응 |
|---|---|
| `plan.status != "passed"`인데 P5 진입 | 즉시 중단 |
| P6-B에서 HB 에디터 사용 여부 응답 없이 design.status 전이 | 즉시 롤백 |
| P7 진입(Y) 후 HB "완료" 없이 design.status 전이 | 즉시 롤백 |
| P6-B `n` 응답으로 P7 skip했는데 P7 기동 | spec 위반, 롤백 |
| deck-verifier FAIL인데 재시도 없이 PASS로 상신 | spec 위반, 즉시 롤백 |
| Pre-flight 토큰 gate 건너뛰고 대량 verifier 실행 | 즉시 중단, HB confirm 수신 후 재개 |
| 부분 재생성 요청에 풀 덱 재생성 | 즉시 중단, 해당 slide만 재생성 |
