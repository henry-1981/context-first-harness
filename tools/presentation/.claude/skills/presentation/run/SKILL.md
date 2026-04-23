---
name: presentation:run
description: "프레젠테이션 풀 프로덕션 오케스트레이터 — plan→design→export 3 단계 자동 연쇄. 신규 E2E 진입 전용. 트리거: '프레젠테이션 만들어줘', '/presentation', '슬라이드 만들어', '발표 자료', '교육 자료', 'pptx 만들어', 'WebPPT 발표'."
---

# presentation:run — 얇은 메타 스킬

신규 E2E 프레젠테이션 제작 진입점. 본 스킬은 **state.json에 write하지 않는다**. plan → design → export 3개 SKILL.md를 순서대로 Read + 지시 따르기로 오케스트레이션한다.

## 실행 모드

**Main thread에서 직접 실행.** 서브에이전트 `Agent()` 서브에이전트로 본 스킬 자체를 호출하지 않는다. 이유: HB gate 상호작용이 각 하위 스킬 내부에 총 3회(P2 outline 승인 / P4 A/B 선택 / P7 에디터 완료)이며, 서브에이전트 문맥에서는 gate 처리가 불가.

각 하위 스킬 내부 producer/verifier agent는 계속 `Agent()`로 서브에이전트 호출(현 orchestrator 방식 그대로). 본 run 스킬은 그 위 층의 "스킬 체인 안내"를 자동으로 이행하는 역할만 수행.

## 대상 시나리오

**E2E 신규 프레젠테이션만.** 기존 프로젝트가 있으면 본 스킬을 호출하지 않는다. 대신 개별 스킬로 진입(Spec §3.2 run 행 Re-entry 동작: "미지원").

진입 시 `{PPT_WORKSPACE_ROOT:-<repo-local workspace root>}/*/state.json` glob:

| 상황 | 처리 |
|---|---|
| 0건 | 신규 E2E — 아래 체인 실행 |
| 1건 이상 | **즉시 중단**. HB에 개별 스킬 진입 안내: "기존 프로젝트가 있습니다. 재수정이라면 `presentation:plan`(내용) / `presentation:design`(시각)으로 직접 진입하세요." |

## 체인 실행 흐름

### Step 1: `presentation:plan` 호출

```
Read .claude/skills/presentation/plan/SKILL.md
→ 본문 지시를 순서대로 이행 (P0~P4 + HB outline 승인 gate + HB A/B 선택 gate)
→ 완료 조건: state.json plan.status == "passed"
```

state.json plan.status가 "passed"가 아닌 상태로 Step 2 진입 금지(Spec §3.3 HARD-GATE).

### Step 2: `presentation:design` 호출

```
Read .claude/skills/presentation/design/SKILL.md
→ 본문 지시 이행 (P5~P7 + HB "완료" 선언 gate)
→ 완료 조건: state.json design.status == "passed"
```

동일하게 design.status "passed" 미확인 시 Step 3 진입 금지.

### Step 3: `presentation:export` 호출

```
Read .claude/skills/presentation/export/SKILL.md
→ 본문 지시 이행 (P8 포맷 선택 gate + P8-B 변환 + P8-C export-verifier + P9 자동 오픈)
→ 완료 조건: state.json export.verifiers.export.status == "passed"
```

### 완료 보고

3 단계 통과 후 HB에 최종 요약:

```
프레젠테이션 제작 완료.
- 프로젝트: {project}
- 모드: {mode} / direction: {direction}
- 슬라이드: {slide_count}장
- 포맷: {formats}
- 경로: {project_root}/export/

state.json: {project_root}/state.json
검증 리포트: {project_root}/verify/{plan,design,export}.md
```

## 합리화 방어

본 스킬은 **HB gate 3회를 건너뛸 수 없다**. 아래 합리화 시도 차단:

| 합리화 | 현실 |
|---|---|
| "HB가 바쁠 테니 outline 자동 승인 후 진행" | P2 gate 위반. HB 응답 없이 P3 진입 금지 |
| "A/B 중 더 나아 보이는 쪽 자동 선택" | P4 gate 위반. HB 명시 선택 필수 |
| "P7 진입(Y) 후 에디터 '완료' 없이 export 진행" | P7 진입 케이스에서는 HB "완료" 선언 필수. 단 P6-B에서 `n` 선택으로 에디터 자체를 skip한 경우는 정상 경로(Spec §3.3 "(선택)")이며 gate 위반 아님 |
| "하위 스킬을 서브에이전트로 돌려 병렬화" | 서브에이전트는 HB gate 처리 불가. 본 스킬은 메인 고정 |
| "기존 프로젝트가 있어도 run으로 이어가자" | Re-entry 미지원. 개별 스킬로 진입 |

## 에러 핸들링

| 상황 | 대응 |
|---|---|
| 기존 프로젝트 1건 이상 발견 | 중단 + 개별 스킬 안내 |
| 하위 스킬이 3차 FAIL root cause 리포트 생성 | HB 선택 gate에서 대기, 선택 수신 후 해당 옵션 실행(옵션별로 plan/design/export 중 재진입 결정) |
| 하위 스킬 Read 실패(파일 부재) | 즉시 중단, HB에 파일 경로 보고 |

## Gate 규율 — Red Flags

| Red Flag | 대응 |
|---|---|
| plan.status != "passed"인데 design Read | 즉시 중단 |
| design.status != "passed"인데 export Read | 즉시 중단 |
| 기존 프로젝트 있는데 run 진입 허용 | 즉시 중단, 개별 스킬 안내 |
| HB gate 자동 통과 | spec 위반 |
| 서브에이전트로 run 재호출 | 구조 위반, 메인 유지 |
