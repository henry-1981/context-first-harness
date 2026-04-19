# Context-First Harness Engineering 체크리스트 (v4)

> 비개발자 하네스 — **6축 · 30개 항목**
>
> 원본 check-harness 체크리스트(24항목, v3)를 기반으로 **B1·D1·D2 3항목 판정 기준 재정의** + **공백 영역 6항목 신규 추가**.
>
> 축은 "사이클"로 정렬: **구조 → 맥락 → 계획 → 실행 → 검증 → 개선** → (다시 구조).

## 3단계 성숙도

| 레벨 | 이름 | 비유 |
|------|------|------|
| **L1** | 시작하기 | 교과서로 문법 배우기 |
| **L2** | 내 것으로 만들기 | 교과서 문법으로 내 글 쓰기 |
| **L3** | 자율 운영 | 글쓰기 스타일이 자리잡음 |

## 분석 프레임 — 2×3 매트릭스

|  | **Static** (갖춘 것) | **Behavioral** (하는 것) | **Δ/Growth** (축적) |
|---|---|---|---|
| **👤 User 스코프** | 1. 구조 | 3. 계획 · 4. 실행 (공유) | 6. 개선 (공유) |
| **📁 Project 스코프** | 2. 맥락 | 4. 실행 (공유) · 5. 검증 | 6. 개선 (공유) |

모든 판정은 **갖춘 것과 실제로 하는 것의 gap** 또는 **하네스가 자라고 있는지**에서 나온다.

---

## 축 1 — 구조 (Scaffolding) · 👤 User × Static [5개]

> "뭘 깔아두었는가?" — 원본 v3와 동일.

| # | 체크 항목 | L | 왜 중요한가 | 판정 근거 (PORTFOLIO) |
|---|----------|:-:|------------|------------------------|
| A1 | 설치된 스킬의 70% 이상이 최근 30일 내 사용됨 | L1 | 안 쓰는 스킬이 많을수록 AI가 엉뚱한 스킬을 트리거할 확률↑ | `used_last_30d / total_installed ≥ 0.7` |
| A2 | Dead 스킬(90일+ 미사용 또는 usageCount=0)이 없다 | L2 | Dead 스킬이 트리거 매칭 단계에서 noise로 작용 | `dead_count == 0` |
| A3 | Ghost 엔트리(usage 기록만 남고 설치 없음)가 없다 | L2 | 히스토리와 실제 상태 불일치 → 분석/복구 시 혼란 | `ghost_count == 0` |
| A4 | 중복 스킬 클러스터(같은 의도 여러 개)가 없다 | L2 | AI가 매번 다른 스킬 선택 → 결과 재현성↓ | `duplicate_clusters == 0` |
| A5 | Prefix 중복/Trigger 충돌이 없다 | L3 | 같은 키워드로 2개 이상 매칭 → 의도와 다른 스킬 실행 | `prefix_duplicates == 0 && trigger_collisions == 0` |

---

## 축 2 — 맥락 (Context) · 📁 Project × Static [9개 — 원본 6 + 신규 3]

> "AI가 무엇을 아는가?" — CLAUDE.md·rules·refs·wiki·skill+wiki 페어 등 프로젝트 지식이 구조적으로 노출되는가.

| # | 체크 항목 | L | 왜 중요한가 | 판정 근거 (CONTEXT) |
|---|----------|:-:|------------|----------------------|
| C1 | CLAUDE.md 존재 & 프로젝트 목적/구조 설명 포함 | L1 | 없으면 매 세션마다 같은 설명 반복 | `has_claude_md && has_project_purpose` |
| C2 | CLAUDE.md 품질 — 모순/ambiguity/placeholder 없음 | L1 | 모순된 지시는 AI를 헷갈리게 함 | `quality.contradictions == 0 && quality.ambiguities == 0` |
| C3 | 민감 파일 보호 — `.gitignore` + PreToolUse 훅 | L1 | 비밀 파일 노출 시 사고 → 사전 차단 | `sensitive_protection.gitignore && sensitive_protection.hook_exists` |
| C4 | Rules 분리 — `.claude/rules/` 파일 ≥ 2개 & 역할 구분 | L2 | CLAUDE.md 비대화 방지 | `rules_count ≥ 2 && rules_have_distinct_scope` |
| C5 | 외부 시스템 연결 — MCP 서버 설정 | L2 | DB·API 등 외부 데이터 직접 접근 | `mcp_configured` |
| C6 | Progressive Disclosure — 조건부 로드 (glob/skill) | L3 | 모든 규칙을 항상 로드하면 컨텍스트 폭발 | `conditional_load_evidence ≥ 1` |
| **C7** | **refs INDEX 드릴다운 건강성** — `refs/INDEX.md` 존재 + 하위 INDEX 체계 | L2 | 정적 참고자료(규정·표준 등) 계층 탐색이 가능해야 AI가 해당 자료를 찾아 쓴다 | `refs_index_exists && sub_index_count ≥ 1` |
| **C8** | **wiki 5-layer 무결성** — sources/pages/raw·sessions/wiki·projects·sessions/schema 층별 존재 | L2 | 동적 지식 구조가 있어야 세션 간 맥락이 복리 누적 | `wiki_layers_present ≥ 4 (5개 중)` |
| **C9** | **skill+wiki 페어 정합성** — 선언된 페어 양쪽 모두 존재 | L3 | thinking frame을 skill+wiki 페어로 관리하면 변주에 강함 | `declared_pairs_count ≥ 1 && all_pairs_resolve` |

---

## 축 3 — 계획 (Planning) · 👤 User × Behavioral [1개]

> "뭘 할지 정하는가?" — 원본 v3와 동일.

| # | 체크 항목 | L | 왜 중요한가 | 판정 근거 (SESSION) |
|---|----------|:-:|------------|----------------------|
| B2 | 계획 후 실행 — specify/scaffold/plan 스킬 활용 | L2 | 바로 작업 시작 vs 계획 후 실행의 품질 격차 | `plan_first_ratio ≥ 0.3` |

---

## 축 4 — 실행 (Execution) · 👤+📁 × Behavioral [4개 — 원본 3 + 신규 1]

> "어떻게 시키는가?" — 위임·병렬·반복 자동화 + 산출물 배송.

| # | 체크 항목 | L | 왜 중요한가 | 판정 근거 (SESSION) |
|---|----------|:-:|------------|----------------------|
| B3 | 위임 활용 — Agent 호출이 있는 세션 비율 | L2 | 메인 컨텍스트 보호 + 병렬화 | `delegation_ratio ≥ 0.4` |
| B5 | 병렬 실행 — `run_in_background=true` 사용 | L3 | 독립 작업 순차 실행은 시간 낭비 | `parallel_count ≥ 1` |
| B6 | 반복 요청 자동화율 — top-5 tool 3-gram이 전체의 30% 미만 | L3 | 같은 패턴 반복 = 스킬/훅 자동화 기회 | `top_ngram_share < 0.3` |
| **B7** | **출력 스킬 사용도** — docx·pdf·pdf-to-md 호출 기록 존재 | L2 | 비개발자 하네스의 2축은 "산출물 배송". 호출 없으면 축 자체가 dormant | `output_skills_invoked ≥ 1 (최근 30일)` |

> 이 축은 User 전역과 Project 전용 세션 양쪽에서 계산. 리포트에는 **User / Project 두 값을 나란히** 표기.

---

## 축 5 — 검증 (Verification) · 📁 × Static+Behavioral [6개 — B1·D1·D2 재정의 / D3·D4·D5 원본 유지]

> "어떻게 믿는가?" — 비개발자 하네스는 "test runner"가 아니라 **문서 산출물 검증 게이트**로 검증한다.

| # | 체크 항목 | L | 왜 중요한가 | 판정 근거 |
|---|----------|:-:|------------|-----------|
| **B1** (재정의) | 세션 종료 전 **검증성 스킬 호출** — `wrap`·`deliverable-review`·`council`·`check-harness` 중 하나 이상 | L1 | 검증 없이 종료하면 "다 됐다"는 착각만 남음. 이 하네스엔 test 대신 스킬 게이트 | SESSION: `skills_invoked ∩ {wrap, deliverable-review, council, check-harness} ≥ 1` per long session |
| **D1** (재정의) | **산출물 검증 환경** — `deliverable-review` 스킬 + 하위 reviewer 에이전트 존재 | L1 | test runner 개념의 이 하네스 등가물. 검증할 수단이 있어야 품질 확인 가능 | AUTOMATION: `deliverable_review_skill_exists && reviewer_agents_count ≥ 1` |
| **D2** (재정의) | **문서 린트 PostToolUse 훅** — wiki-check 등 문서 린트/스타일 체크 훅 | L1 | 매번 수동 린트 = 반복 비용. 훅으로 자동화 | AUTOMATION: `posttool_doc_lint_hook OR settings.json PostToolUse에 문서 린트 성격 command` |
| D3 | 위험 작업 차단 — PreToolUse 훅 존재 | L1 | rm -rf, force push, 템플릿 덮어쓰기 등 실수 방지 | AUTOMATION: `pretool_block_hook` |
| D4 | 프로젝트 스킬/훅 실제 사용됨 — 세션에서 호출 확인 | L2 | 만들어두고 안 쓰면 존재 가치 없음 | AUTOMATION: `project_skills_used ≥ 1` |
| D5 | 만드는/검증 AI 분리 — verifier 류 에이전트 존재 | L3 | 같은 AI가 구현·검증하면 자기확증 편향 | AUTOMATION: `verifier_agent_exists` |

---

## 축 6 — 개선 (Compounding) · 👤+📁 × Growth [6개 — 원본 4 + 신규 2]

> "어떻게 나아지는가?" — 세션 학습이 하네스 artifact로 환류되고, 세션 자체도 raw/wiki 파이프라인으로 축적되는가.

| # | 체크 항목 | L | 왜 중요한가 | 판정 근거 |
|---|----------|:-:|------------|-----------|
| E1 | 최근 30일 내 CLAUDE.md/rules/docs 중 하나라도 갱신됨 | L1 | 설정이 한 번도 업데이트 안 되면 학습이 축적 안 됨 | AUTOMATION: `compounding.claude_md_updated_30d OR rules_added_90d>0` |
| B4 | 세션 인수인계 — session-wrap/memory write 흔적 | L2 | 인수인계 없으면 다음 세션에서 같은 설명 반복 | SESSION: `handoff_ratio ≥ 0.5` |
| E2 | session-wrap / compound / memory-write 류 사용 ≥1회 | L2 | 세션 학습이 외부 기록으로 환류 | SESSION: `skills_invoked` 에 wrap/compound/memory 계열 포함 |
| E3 | 최근 90일 내 프로젝트에 새 skill/hook/rule 추가 | L3 | 개선안이 artifact로 굳어야 L3 달성 | AUTOMATION: `compounding.skills_added_90d ≥ 1 OR hooks_added_90d ≥ 1` |
| **E4** | **handoff 라이프사이클 closure율** — frontmatter status(ready/blocked/scheduled) + stale 비율 | L2 | handoff 체계가 쓰기만 하고 완료·삭제 안 되면 "기록의 저주" | AUTOMATION: `handoff_files_count ≥ 1 && stale_ratio < 0.5 && status_field_present_ratio ≥ 0.8` |
| **E5** | **seCall→codex 세션 아카이빙 최근 활동** — `wiki/raw/sessions/` 또는 `wiki/wiki/projects|sessions/` 최근 30일 파일 ≥1 | L3 | 대화 세션이 맥락 자산으로 복리 누적되는 파이프라인 작동 여부 | AUTOMATION: `raw_sessions_recent_30d ≥ 1 OR wiki_sessions_recent_30d ≥ 1` |

---

## 판정 상태

| 상태 | 의미 |
|------|------|
| **PASS** | 증거 기반 충족 |
| **WEAK_PASS** | 조건은 만족하나 품질 낮음 (Quick Win 후보) |
| **FAIL** | 증거 없음 또는 명시적 실패 |
| **N/A** | 프로젝트 성격상 적용 불가 또는 증거 수집 불가 |

스코어 계산: PASS=1, WEAK_PASS=0.5, FAIL=0, N/A=제외 · 가중치 L1×3, L2×2, L3×1

---

## 성숙도 달성 규칙

- **축별 레벨**: 해당 축의 모든 L1 항목 PASS/WEAK_PASS → L1 달성, L2도 모두 → L2 달성, …
- **User Maturity**: 축 1 · 3 · 4(User부분) · 6(User부분) 중 낮은 레벨
- **Project Maturity**: 축 2 · 4(Project부분) · 5 · 6(Project부분) 중 낮은 레벨

---

## "잘 가고 있다"는 신호 (비개발자 하네스 맥락)

- 같은 말을 두 번 하지 않는다 (CLAUDE.md·rules·wiki로 맥락 축적)
- 실수가 규칙이 된다 (축 6 개선 루프)
- refs INDEX로 drill-down해서 본문에 도달한다 (축 2 자산 활용)
- 산출물이 docx·pdf로 배송된다 (축 4 출력)
- 세션 시작 시 handoff·seCall→codex 파이프라인이 어제 맥락을 띄워준다

## "실패하고 있다"는 징후

- 설정 파일이 길어지기만 한다 (맥락 비대화)
- deliverable-review 없이 세션 끝난다 (검증 부재)
- wiki/sources에 사료는 쌓이는데 pages/ filing 안 된다 (맥락 축적 실패)
- handoff는 쓰는데 완료·삭제가 안 된다 (라이프사이클 정체)
- skill+wiki 페어 한쪽만 수정된다 (정합성 깨짐)

---

## 용어집 (비개발자 하네스 추가 용어)

| 용어 | 뜻 |
|------|----|
| **3축 구조** | 1축 입력·2축 출력·3축 맥락 유지. 비개발자 하네스 CLAUDE.md의 정체성 정의. |
| **refs INDEX 드릴다운** | `refs/INDEX.md` → 하위 INDEX → 본문 순으로 AI Agent가 탐색하는 계층. 수백 건 중 1건에 빠르게 도달. |
| **wiki 5-layer** | sources(큐레이션 원재료) · pages(박제) · raw/sessions(세션 수집) · wiki/projects·sessions(codex 1차 정리) · schema. |
| **skill+wiki 페어** | thinking frame을 skill(트리거·인덱스)과 wiki page(본문 단일 소스) 페어로 관리. 변주에 강함. |
| **handoff 라이프사이클** | 생성 → hook 자동 스캔 → 조사·제안 → 사용자 결정 → 완료·삭제. frontmatter `status: ready/blocked/scheduled`. |
| **seCall→codex 파이프라인** | 대화 세션 → seCall ingest → `raw/sessions/` → codex 1차 정리 → `wiki/projects·sessions/` → LLM filing 시 참고. |
| **출력 축 스킬** | docx·pdf·pdf-to-md — AI 산출물을 사람이 받는 형식으로 변환. 비개발자 하네스의 2축. |

---

*총 30개 항목 (6축) | L1: 11개, L2: 12개, L3: 7개*
