# 🧭 Context-First Harness Maturity Report (v4)

**2026-04-19** · Scope: `all` · Project: `C:\Project1` (비개발자 하네스)

> 원본 check-harness(v3, 24항목) 대비 B1·D1·D2 **재정의** + C7-C9·B7·E4-E5 **신규 6항목** 추가. Step 1 리포트(원본 실행)와 병렬 보관.

---

## 🧭 Harness Score: **41 / 100** (Needs Work)

```
👤 User Scope     L0  ▓░░░░░░░░░  11%   (Score: 11)
📁 Project Scope  L0  ▓▓▓▓░░░░░░  44%   (Score: 44)
🔁 Compounding    L1  ▓▓▓▓▓▓▓░░░  68%   (Score: 68)
```

## 🎯 한 줄 요약

> 파생 스킬 실행 결과 Step 1 대비 Score 47→41, Compounding 94→68(L3→L1). 축 6의 신규 2항목(E4 handoff·E5 session archiving)이 원본에서 안 재서 과대평가돼 있었음. 재정의된 D1은 FAIL→PASS 반전, 이 하네스의 실제 검증 자산이 제대로 측정됨.

**잘 되고 있는 것**: 축 2(맥락) Score 79 L3 — 기존 L3 유지 + 신규 C7(refs INDEX) PASS · C8(wiki 5-layer) WEAK · C9(skill+wiki 페어) PASS. context-first 자산 구조는 갖춰져 있음

**개선하면 좋을 것**: 축 6의 실제 gap이 드러남 — E4(handoff 라이프사이클) FAIL · E5(seCall→codex 아카이빙) FAIL. "구조는 선언됐는데 실제 workflow 아직 미시작"이라는 공통 패턴

---

## 🔄 Step 1 대비 변화표

| 지표 | Step 1 (v3) | Step 2 (v4) | 변화 | 해석 |
|---|---:|---:|---|---|
| Harness Score | 47 | 41 | ▼ 6 | 과대평가 교정 |
| User Score | 8 | 11 | ▲ 3 | B7 User WEAK 반영 |
| Project Score | 40 | 44 | ▲ 4 | D1 PASS 반전 |
| Compounding | 94 | 68 | ▼ 26 | E4·E5 신규 FAIL 반영 |
| Compounding Level | L3 | **L1** | 2단계 ▼ | 실제 상태에 더 가까움 |

**재정의 3항목 반영**
| 항목 | Step 1 판정 | Step 2 판정 | 반전 |
|---|---|---|---|
| **B1** | FAIL (test/ralph 없음) | FAIL (Project 검증성 스킬 호출 0) | 판정 유지, 근거 정확화 |
| **D1** | FAIL (test runner 없음) | **PASS** (deliverable-review 스킬 + 9개 reviewer 에이전트) | ★ 반전 |
| **D2** | FAIL (포맷터 훅 없음) | FAIL (문서 린트 PostToolUse 훅 없음) | 판정 유지, 진짜 gap 확인 |

**신규 6항목 결과**
| 항목 | 판정 | 근거 |
|---|---|---|
| **C7** refs INDEX 드릴다운 | PASS | `refs/INDEX.md` + 하위 INDEX 4개(regulations/FDA 계층) |
| **C8** wiki 5-layer 무결성 | WEAK_PASS | 5개 층 구조 존재하나 대부분 `.gitkeep`뿐 (content 미축적) |
| **C9** skill+wiki 페어 | PASS | `medical-device-ra-qa-frame` ↔ `wiki/pages/medical-device-ra-qa-thinking-frame.md` 양쪽 resolve |
| **B7** 출력 스킬 사용도 | FAIL(Project) / WEAK(User) | User에서 pdf-to-md 2회만. Project 세션 0 |
| **E4** handoff 라이프사이클 | FAIL | `drafts/handoffs/`·`**/HANDOFF.md` 파일 0건. 명세는 rules/handoff.md에 있으나 실제 workflow 미시작 |
| **E5** seCall→codex 아카이빙 | FAIL | `wiki/raw/sessions/` `wiki/wiki/projects|sessions/` 최근 30일 파일 0건. 파이프라인 dormant |

---

## 🔄 사이클 한눈에 보기

1. **구조** · 👤 User — ⚠️ 76개 중 46개(60.5%) 사용, dead 52건. User 전역 잡동사니 (이 레포 이슈 아님)
2. **맥락** · 📁 Project — ✅ L3. CLAUDE.md + rules 7개 + 조건부 로드 3건 + 신규 C7·C9 PASS · C8 WEAK
3. **계획** · 👤 User — ❌ plan_first_ratio 16.8%
4. **실행** · 👤+📁 — ❌ Project 세션 6개뿐. delegation 17%, parallel 0. B7 출력 스킬 호출 미미
5. **검증** · 📁 Project — ⚠️ D1 PASS(등가물 반영), D2·B1 FAIL(이 하네스 gap). D3·D4·D5 PASS
6. **개선** · 👤+📁 — ⚠️ L1. E1·B4·E2 PASS, E3 WEAK. E4·E5 FAIL — **Static 자산과 실제 workflow 사이 gap**

---

## ✅ 지금 하면 좋은 것

### 🟢 바로 해볼 만한 것
- [ ] 📁 **handoff 예제 파일 하나 작성해 `drafts/handoffs/`에 배치** — 예상 효과: E4 FAIL → WEAK_PASS, 다른 사용자에게 handoff 체계 사용 실증
  - 제안 경로: `drafts/handoffs/example-{topic}.md` (rules/handoff.md 템플릿 사용)
  - 근거: 명세 문서는 있는데 실제 파일 0건 — 체계가 살아있지 않음

- [ ] 📁 **세션 종료 시 `/wrap` 호출해서 첫 세션 아카이브** — 예상 효과: E5 FAIL → PASS, seCall→codex 파이프라인 가동 확인
  - 제안 명령: 세션 끝에 `/wrap` 실행
  - 근거: wiki/raw/sessions/ 최근 30일 파일 0건 — 아카이빙 파이프라인 dormant

### 🟡 한 번 정리하면 좋을 것
- [ ] 📁 **문서 린트 PostToolUse 훅 설계** (D2 등가물 실제 구현) — 예상 효과: D2 FAIL → PASS, 문서 일관성 자동 점검
  - 참고: wiki-check.sh는 SessionStart로 이미 wire됨. PostToolUse 용 별도 훅 필요 (예: 번역투 검출, markdown lint)
  - 근거: 비개발자 하네스 검증 축의 핵심 빈자리

- [ ] 📁 **wiki/sources/에 첫 큐레이션 자료 배치** — 예상 효과: C8 WEAK → PASS, wiki 5-layer 실제 작동 실증
  - 참고: 현재 `.gitkeep`만. rules/handoff.md나 content-writing.md 같은 내부 자료를 sources로 옮기거나, 외부 참고자료 ingest

### 🔴 시간 내서 다뤄볼 것
- [ ] 📁 **context-first-auditor 에이전트를 다음 세션에서 실전 적용** — 예상 효과: 수동 glob 우회 없이 파생 스킬 자동 진단
  - 근거: 이번 세션에서 신규 에이전트가 즉시 로드 안 됨(세션 경계 제약). 다음 세션 시작 시 인식 확인

- [ ] 📁 **skill+wiki 페어 2번째 사례 추가** — 예상 효과: C9 고도화, 패턴 반복으로 다른 사용자에게 레퍼런스 가치
  - 근거: 현재 페어 1건만 — 단일 사례라 패턴이 아직 약함

---

## 📊 축별 스코어카드 (v4, 30항목)

| Axis | Scope | Items | Score | Level | 비고 |
|------|-------|------:|------:|:-----:|---|
| 1. 구조 (Scaffolding)      | 👤 User     | 5 |  0 | L0 | Step 1과 동일 |
| 2. 맥락 (Context)          | 📁 Project  | 9 | 79 | L3 | 신규 C7·C8·C9 반영 |
| 3. 계획 (Planning)         | 👤 User     | 1 |  0 | L1 auto | Step 1과 동일 |
| 4. 실행 (Execution)        | 👤+📁        | 4 | User 33 / Project 0 | L0 | 신규 B7 추가 |
| 5. 검증 (Verification)     | 📁 Project  | 6 | 53 | L0 | D1 PASS 반전 (40→53) |
| 6. 개선 (Compounding)      | 👤+📁        | 6 | 68 | **L1** | 신규 E4·E5 FAIL로 L3→L1 |

Sessions analyzed: User 113 (7d) / Project 6 (30d) · Scanned: 2026-04-19

---

## 📋 상세 체크리스트 — 변경 항목만

> 유지 21항목(A1-A5, C1-C6, B2, B3·B5·B6, D3·D4·D5, E1·B4·E2·E3)은 Step 1 리포트 참조.

### 축 2 — 맥락 (신규 3항목)
| ID | L | Item | Status | Evidence |
|----|---|------|--------|----------|
| C7 | L2 | refs INDEX 드릴다운 | PASS | `refs/INDEX.md` + `refs/regulations/INDEX.md` + 하위 3개 (FDA/01-statute, 02-regulation, 03-guidance) |
| C8 | L2 | wiki 5-layer 무결성 | WEAK_PASS | sources/pages/raw/sessions/wiki·projects/wiki·sessions 5개 층 존재. 대부분 `.gitkeep`뿐 — 구조 있고 content 없음 |
| C9 | L3 | skill+wiki 페어 정합성 | PASS | 선언 페어 1건 resolve: `.claude/skills/medical-device-ra-qa-frame/` + `wiki/pages/medical-device-ra-qa-thinking-frame.md` |

### 축 4 — 실행 (신규 1항목)
| ID | L | Item | User | Project | min | Evidence |
|----|---|------|------|---------|-----|----------|
| B7 | L2 | 출력 스킬 사용도 (최근 30일) | WEAK(pdf-to-md 2회) | FAIL(호출 0) | FAIL | SESSION_USER.skills_invoked = {pdf-to-md: 2}. SESSION_PROJECT에 출력 스킬 없음 |

### 축 5 — 재정의 3항목
| ID | L | Item | Status | Evidence |
|----|---|------|--------|----------|
| B1(재) | L1 | 세션 종료 전 검증성 스킬 호출 | FAIL(project) | User: wrap 10 + deliverable-review 10 → PASS. Project: long_sessions=1에서 검증성 스킬 0회 호출 → FAIL. min = FAIL |
| D1(재) | L1 | deliverable-review 스킬 + reviewer 에이전트 | **PASS** | `.claude/skills/deliverable-review/` 존재 + `.claude/agents/deliverable-{general,meddev-compliance,plan,spec}-reviewer.md` 4개 + wrap-bias-reviewer 등 총 9개 reviewer 에이전트 |
| D2(재) | L1 | 문서 린트 PostToolUse 훅 | FAIL | settings.json PostToolUse 배열 비어있음. wiki-check.sh는 SessionStart로 wire됨 (PostToolUse 아님). 문서 린트 성격 훅 현재 0 |

### 축 6 — 개선 (신규 2항목)
| ID | L | Item | Status | Evidence |
|----|---|------|--------|----------|
| E4 | L2 | handoff 라이프사이클 closure율 | FAIL | `drafts/handoffs/*.md` 0건. `**/HANDOFF.md` 0건. 명세(rules/handoff.md 230줄)는 있으나 실제 파일 없음 |
| E5 | L3 | seCall→codex 세션 아카이빙 최근 활동 | FAIL | `wiki/raw/sessions/` `wiki/wiki/projects/` `wiki/wiki/sessions/` 모두 `.gitkeep`만. 최근 30일 파일 0건 |

---

## 🔍 Step 2 핵심 Findings

**High Priority**
- 💡 **원본 과대평가 교정 확인** — Compounding L3 → L1. E4·E5 FAIL이 "구조만 있고 workflow 미시작"이라는 일반 패턴을 드러냄. 파생 스킬이 원본보다 정확한 진단 실증
- 💡 **D1 PASS 반전** — test runner 대신 deliverable-review + 9개 reviewer 에이전트로 검증 환경 성립. 이 하네스의 실제 자산이 측정됨

**Medium Priority**
- 💡 **C9 PASS** — skill+wiki 페어 패턴이 작동하는 증거. 다른 사용자가 fork 시 이 패턴을 참조할 수 있음
- 💡 **B7 FAIL(Project)** — 출력 축이 이 레포 세션에서는 dormant. 산출물 배송이 비개발자 하네스의 2축인데 실사용 없음

**Low Priority**
- 💡 **D2 FAIL 유지** — 문서 린트 PostToolUse 훅이 이 하네스에 여전히 빈 자리. 설계 여지
- 💡 **C7 PASS** — refs INDEX 드릴다운 체계는 이 레포가 교재로 작동 가능한 상태

---

## ⚠️ 이번 실행 제약 사항

**context-first-auditor 에이전트 호출 실패** — 이 세션에서 신규 생성한 `.claude/agents/context-first-auditor.md`가 `Agent type not found`로 호출 안 됨. Claude Code는 **세션 시작 시점의 에이전트 목록을 고정**하므로 같은 세션에서 생성한 에이전트는 즉시 로드되지 않는다. 우회책으로 수동 glob/bash 수집으로 진단 완료.

**영향**
- Step 1의 AUTOMATION.json(project-automation-auditor 결과)을 재사용
- 재정의 3항목(B1·D1·D2)과 신규 6항목(C7-C9·B7·E4-E5)은 내가 직접 수집·판정
- 결론적으로 진단 결과는 정확 — 다만 수동 우회라 자동화 검증은 다음 세션에서 재확인 필요

**다음 세션 action**: `/check-harness-context-first` 재실행하면 context-first-auditor 정상 호출 여부 확인 가능

---

📁 Saved: `.harness/check-reports/check-harness-context-first-2026-04-19-all/report.md`
