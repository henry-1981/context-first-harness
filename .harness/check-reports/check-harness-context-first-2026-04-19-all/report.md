# 🧭 Harness Maturity Report

**2026-04-19** · Scope: `all` · Project: `C:\Project1` (비개발자 하네스)

---

## 🧭 Harness Score: **47 / 100** (Needs Work)

```
👤 User Scope     L0  ░░░░░░░░░░   8%   (Score: 8)
📁 Project Scope  L0  ▓▓▓▓░░░░░░  40%   (Score: 40)
🔁 Compounding    L3  ▓▓▓▓▓▓▓▓▓░  94%   (Score: 94)
```

## 🎯 한 줄 요약

> User L0 / Project L0 — 기본 체크리스트가 개발 지향이라 이 하네스 맥락에 정확히 안 맞습니다. 공백 영역(refs INDEX·wiki 5-layer·skill+wiki 페어·handoff 라이프사이클)이 아예 측정 안 된 게 가장 큰 신호.

**잘 되고 있는 것**: 축 2(맥락) L3 달성 — CLAUDE.md 102줄 + rules 7개 distinct scope + conditional_load 3건. 축 6(개선) L3 — compounding assets 전부 존재

**개선하면 좋을 것**: 축 5(검증)의 D1·D2·B1이 "개발 지향 측정 기준"이라 FAIL. 이 하네스의 실제 검증 자산(`deliverable-review`·`wrap-bias-reviewer`·`wiki-check.sh`)은 체크리스트가 측정 못 함

---

## 🔄 사이클 한눈에 보기

1. **구조** · 👤 User — ⚠️ 76개 설치 중 46개(60.5%) 사용, dead 52건. User 전역에 여러 프로젝트 자산 혼재 (이 레포 이슈 아님)
2. **맥락** · 📁 Project — ✅ L3. CLAUDE.md + rules 7개 + 조건부 로드 3건
3. **계획** · 👤 User — ❌ plan_first_ratio 16.8% (brainstorming·writing-plans 각 11회 있으나 비율 낮음)
4. **실행** · 👤+📁 — ❌ 이 Project 세션 6개뿐이라 표본 약함. delegation 17%, parallel 0
5. **검증** · 📁 Project — ⚠️ D1(test runner)·D2(포맷터 PostToolUse)·B1(test/ralph) FAIL은 이 하네스에 부적합. D3·D4·D5 PASS
6. **개선** · 👤+📁 — ✅ L3. CLAUDE.md·hooks·skills 다 있음. 단 git history는 단일 init commit (WEAK flag)

---

## ✅ 지금 하면 좋은 것

### 🟢 바로 해볼 만한 것
- [ ] 📁 **wiki-check.sh를 settings.json PostToolUse에 wire** — 예상 효과: D2 FAIL → PASS
  - 제안: `.claude/settings.json`에 PostToolUse 배열 추가 + `python .claude/hooks/wiki-check.sh` 등록
  - 근거: 파일 존재하나 훅 등록 안 됨. CLAUDE.md 선언과 settings.json wire 사이 gap

- [ ] 📁 **공백 영역 6개를 Step 2 spec 입력물로 박제**
  - refs INDEX 드릴다운 / wiki 5-layer / skill+wiki 페어 / handoff 라이프사이클 / seCall→codex 파이프라인 / 출력 축
  - 근거: 현행 체크리스트 어디에도 없음 — 이 하네스의 핵심 자산이 측정 밖

### 🟡 한 번 정리하면 좋을 것
- [ ] 📁 **D1·D2·B1 3항목 판정 기준을 이 하네스 등가물로 재정의 (Step 2 체크리스트에 반영)**
  - D1 test runner → `deliverable-review` 스킬 + reviewer 에이전트 존재
  - D2 PostToolUse 포맷터 → 문서 린트 훅 (`wiki-check.sh` 등)
  - B1 test/ralph 호출 → `wrap`·`deliverable-review`·`council` 호출
  - 근거: 검증 개념은 이 하네스에도 있고 형태만 다름

- [ ] 👤 **User 스코프 정리는 별도 작업** — 이 레포 이슈 아님. `/repo-cleanup` 돌리거나 `.claude.json` 직접 정리

### 🔴 시간 내서 다뤄볼 것
- [ ] 📁 **비개발자 전용 파생 스킬 `check-harness-context-first` 설계·구현**
  - 본 24항목 + 공백 영역 6개 신규 축 = 약 30항목
  - `project-automation-auditor` 대신 `context-first-auditor` 신규 또는 확장
  - 근거: 본 세션이 Step 2로 지목한 작업

---

## 📊 축별 스코어카드

| Axis | Scope | Score | Level |
|------|-------|------:|:-----:|
| 1. 구조 (Scaffolding)      | 👤 User     |  0 | L0 |
| 2. 맥락 (Context)          | 📁 Project  | 79 | L3 |
| 3. 계획 (Planning)         | 👤 User     |  0 | L1 자동 |
| 4. 실행 (Execution)        | 👤+📁        | User 25 / Project 0 | L0 |
| 5. 검증 (Verification)     | 📁 Project  | 40 | L0 |
| 6. 개선 (Compounding)      | 👤+📁        | 94 | L3 |

Sessions analyzed: User 113 (7d) / Project 6 (30d) · Scanned: 2026-04-19

---

## 🔌 Runtime Inventory

**플러그인** (11개 설치, 모두 user-enabled)
- harness 1.0.1 (skills 20) · superpowers 5.0.2 (skills 28) · codex 1.0.1 (skills 3) · claude-md-management 1.0.0 · clarify 2.0.0 · claude-hud 0.0.10 · ralph-loop 1.0.0 · pyright-lsp · typescript-lsp · frontend-design
- 주목: `pyright-lsp`·`typescript-lsp`·`frontend-design` — 비개발자 하네스 맥락에 불필요 (dead)

**MCP 서버** (5개, 모두 사용 중)
- word 3844회 · hwp 2479회 · context7 535회 · secall 335회 · sequential-thinking 284회 (30일)

**스킬 출처**
- user_standalone: 0 / from_plugins: 64 / project_local: 18 (실제 디스크 12개 SKILL.md + 나머지는 리소스)

---

## 🧩 공백 영역 — 체크리스트에 존재하지 않는 자산 (Step 2 증거)

현행 24항목에 없어 측정이 원천적으로 불가능한 이 하네스의 핵심 자산:

| # | 공백 영역 | 이 레포의 실체 | 측정 불가 이유 |
|---|----------|-------------|---------------|
| 1 | **refs INDEX 드릴다운 건강성** | `refs/INDEX.md` → statute 117 · regulation 35 · guidance 1 sample 계층 | 어느 축에도 "참고자료 INDEX 계층 탐색 가능 여부" 항목 없음 |
| 2 | **wiki 5-layer 무결성** | sources/pages/raw·sessions/wiki·projects·sessions/schema | 체크리스트 전체에 "wiki 구조" 개념 부재 |
| 3 | **skill+wiki 페어 정합성** | `medical-device-ra-qa-frame` ↔ `wiki/pages/medical-device-ra-qa-thinking-frame.md` 페어 | 페어 개념 자체가 없음 |
| 4 | **handoff 라이프사이클 closure율** | `drafts/handoffs/*.md` + `{proj}/HANDOFF.md` frontmatter·status 전이 | hook은 스캔만, 체크리스트는 존재 여부만 |
| 5 | **seCall→codex 세션 아카이빙** | `raw/sessions/YYYY-MM-DD/` + `wiki/projects·sessions/` 파이프라인 | 세션 데이터 외부 이관 개념 없음 |
| 6 | **출력 축 스킬 사용도** | `docx`·`pdf`·`pdf-to-md`가 실제 산출물 배송 역할 수행 여부 | "출력"이 독립 축이 아님 (축 1 구조에 섞임) |

---

## 🔁 Compounding 상세 (축 6)

- CLAUDE.md 최근 30일 갱신: **Yes** (2026-04-19 init)
- `.claude/rules/` 최근 90일 추가: **7개 존재, git history는 init 1건** — disk state는 PASS, historic evidence는 WEAK
- `skills/` 최근 90일 추가: 6개 tracked + 6개 disk-only
- `hooks/` 최근 90일 변경: 6건 (block-template-write·session-start-handoff-scan·session-start-context-inject·wiki-check.sh·test_session_start·settings.json)
- `docs/learnings/` 존재: No (`docs/` 자체 없음)
- memory 호출: User 다수(wrap·skill-creator 각 10회 등), Project 2회 (brainstorming·check-harness)

**관찰**
- 단일 init commit(e4fcca3) + LICENSE 추가 두 건뿐. "하네스가 자라는지"의 **historic 증거가 아직 없음** — 레포 자체가 방금 공개된 상태
- wiki-check.sh 파일은 있으나 settings.json에 wire 안 됨 — Static asset vs Behavioral wire gap

---

## 📋 상세 체크리스트 (6축 · 24항목)

### 축 1 — 구조 (👤 User × Static)
| ID | L | Item | Status | Evidence |
|----|---|------|--------|----------|
| A1 | L1 | 70%+ skills used last 30d | FAIL | 46/76 = 60.5% |
| A2 | L2 | Dead 스킬 0 | FAIL | 52 dead (superpowers 25, harness 16 포함) |
| A3 | L2 | Ghost 엔트리 0 | FAIL | 20 ghost (session-wrap:* 3, linear-sync, manpower 등) |
| A4 | L2 | Duplicate 클러스터 0 | FAIL | 13 (plan·review·wrap·skill-creator 테마) |
| A5 | L3 | Prefix·Trigger 충돌 0 | FAIL | prefix 4 (wrap, brainstorming, executing-plans, unknown), trigger 0 |

### 축 2 — 맥락 (📁 Project × Static)
| ID | L | Item | Status | Evidence |
|----|---|------|--------|----------|
| C1 | L1 | CLAUDE.md + purpose | PASS | 102줄, 하네스 레포 정의 명시 |
| C2 | L1 | 모순·ambiguity·placeholder 없음 | WEAK_PASS | contradictions 0, ambiguities 1, placeholders 1 (의도적 `<PATH_TO>`) |
| C3 | L1 | 민감파일 보호 | WEAK_PASS | gitignore OK, PreToolUse 차단 훅은 템플릿 전용(block-template-write). .env 결정론적 차단 미구현 |
| C4 | L2 | rules 분리 ≥2, distinct scope | PASS | 7개 (content-writing·naming·binary-files·qms-sop·workflow·handoff·session-entry + INDEX) |
| C5 | L2 | MCP 설정 | PASS | 4 서버 (context7·seq·word·hwp) |
| C6 | L3 | Progressive Disclosure | PASS | conditional_load_evidence 3 (@rules import, 대화/산출물 분기, hands-off 예외) |

### 축 3 — 계획 (👤 User × Behavioral)
| ID | L | Item | Status | Evidence |
|----|---|------|--------|----------|
| B2 | L2 | plan_first_ratio ≥ 0.3 | FAIL | 0.168 (brainstorming 11 + writing-plans 11 / 113 세션) |

### 축 4 — 실행 (👤+📁 × Behavioral)
| ID | L | Item | User | Project | min | Evidence |
|----|---|------|------|---------|-----|----------|
| B3 | L2 | delegation ≥ 0.4 | 0.354 | 0.167 | FAIL | Agent 169회(User) / 5회(Project) |
| B5 | L3 | parallel ≥ 1 | 9 | 0 | FAIL(proj) | run_in_background 사용 사례 |
| B6 | L3 | top 3-gram < 0.3 | 0.343 | 0.726 | FAIL | Bash→Bash→Bash 패턴 지배 |

### 축 5 — 검증 (📁 Project)
| ID | L | Item | Status | Evidence |
|----|---|------|--------|----------|
| B1 | L1 | 세션 종료 전 test/ralph | FAIL | completion_check 0.167 — **판정 기준이 test/ralph라 wrap·deliverable-review 호출 놓침** |
| D1 | L1 | test runner 설정됨 | FAIL | package.json·Makefile·pyproject 전부 없음 — **비개발자 레포라 부적합** |
| D2 | L1 | PostToolUse 포맷터 훅 | FAIL | settings.json에 PostToolUse 배열 없음. wiki-check.sh 파일 있으나 wire 안 됨 |
| D3 | L1 | PreToolUse 위험 차단 훅 | PASS | block-template-write.py 등록 |
| D4 | L2 | 프로젝트 스킬 사용 ≥1 | PASS | 7/12 스킬 사용 (usage_rate 58%) |
| D5 | L3 | verifier 에이전트 | PASS | 9개 reviewer 에이전트 (deliverable-*·wrap-bias·context-quality 등) |

### 축 6 — 개선 (👤+📁 × Growth)
| ID | L | Item | Status | Evidence |
|----|---|------|--------|----------|
| E1 | L1 | CLAUDE.md/rules/docs 30d 갱신 | PASS | CLAUDE.md init 2026-04-19 |
| B4 | L2 | handoff_ratio ≥ 0.5 | PASS | User 0.589 / Project 1.0 |
| E2 | L2 | wrap/compound/memory 호출 ≥1 | PASS | User 다수(wrap·skill-creator 각 10회), Project 2회 |
| E3 | L3 | 90일 내 신규 skill/hook/rule | WEAK_PASS | disk에 있음. git history는 init 단일 commit |

---

## 🔍 Findings

**High Priority**
- 💡 체크리스트에 공백 영역 6개 신규 축 추가 필요 (refs·wiki·skill+wiki·handoff·seCall→codex·출력 축) — Step 2 파생 스킬 설계 입력물
- 💡 D1·D2·B1 판정 기준 재정의 — `deliverable-review`·`wiki-check.sh`·`wrap` 계열이 이 하네스의 등가물

**Medium Priority**
- 💡 wiki-check.sh를 settings.json PostToolUse에 wire하면 D2 즉시 PASS
- 💡 User 스코프 축 1 FAIL들은 이 레포가 아닌 User 전역 정리 대상 — 별도 `/repo-cleanup` 세션

**Low Priority**
- 💡 prefix 중복 4건(wrap, brainstorming, executing-plans, unknown) — skill trigger 일관성
- 💡 project-scope `enabledPlugins` 도입하면 dev 전용 플러그인 로드 안 함

---

📁 Saved: `.harness/check-reports/check-harness-2026-04-19-all/report.md`
