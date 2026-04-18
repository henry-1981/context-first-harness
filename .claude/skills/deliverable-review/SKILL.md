---
name: deliverable-review
description: Use when finishing a document deliverable (law memo, SOP, tech spec, proposal, wiki page, compliance report) before declaring it done, before wrap, or when user says "/deliverable-review", "산출물 검증", "리뷰 돌려", "검증 게이트". Dispatches to a domain-specific reviewer agent and runs a verification gate sourced from feedback memory.
---

# Deliverable Review

Domain verification gate for document deliverables. The goal is to catch the failure modes that keep showing up in feedback memory — missed exception clauses, scope creep, unverified assumptions, misattributed specs — **before** 사용자 sees the draft, not after.

This skill is a **dispatcher**. The actual review happens in a reviewer agent. Your job here is: detect document type, pick the right reviewer, hand it the file + context, and format the result.

## Why This Exists

사용자's 6-axis harness diagnosis put 검증 (verification) at 5/10 — the thinnest axis. The pattern: doctrine is strong ("Verify Before Done", "Problem Diagnosis First"), but there's no automation for document deliverables, so the same verification failures keep accumulating as `feedback_*.md` entries. This skill closes that loop by turning those feedbacks into an active pre-flight check.

Every run should reduce the probability of a new `feedback_*` entry being written for the same class of mistake.

## When To Trigger

Invoke this skill when any of the following is true:
- 사용자 explicitly says `/deliverable-review`, "산출물 검증", "리뷰 돌려", "검증 게이트", "검토 돌려"
- A deliverable file under `drafts/`, `deliverables/`, `compliance/`, `wiki/pages/` was just created or substantially edited, and 사용자 is about to conclude the session
- The `wrap` skill is running and detects one or more deliverable candidates in the session diff
- 사용자 is about to send a document to a client, regulator, or stakeholder

Do **not** trigger on:
- Code files (`.py`, `.ts`, `.js`, …) — those belong to `superpowers:requesting-code-review`
- Scratch notes, TODO lists, session logs, secall-vault files
- Commits of reference material into `refs/` or `wiki/sources/`

## Inputs

The skill accepts one of:
1. **File path** — absolute or relative to repo root. Primary mode.
2. **Multiple paths** — batch mode, one reviewer call per file.
3. **No argument** — auto-detect deliverable candidates from `git status` + recent Write/Edit history, then ask 사용자 which to review.

## Dispatch Logic

### Step 1 — Read the file

Use the Read tool on the target path. Grab:
- Full content (or head 400 lines + tail 100 for very long files)
- Frontmatter if present
- File path and parent directory

### Step 2 — Detect type (dispatcher) and subtype

Type detection has **two axes**:

**Axis 1 — Dispatcher type** (which reviewer agent gets called). Apply heuristics in order. First match wins.

**meddev-compliance** if any of:
- Path contains `compliance/`, `refs/regulations/`, `refs/info-security/`
- Content mentions 3+ of: 의료기기법, 약사법, 시행령, 시행규칙, 고시, 식약처, MFDS, IEC 62304, ISO 13485, ISO 14971, GMP, QMS, GCP, 약관, 계약서, SOP, TPQQ, audit, HIRA 수가
- Frontmatter `type: regulation | compliance | sop | legal-memo`
- File name contains `sop-`, `법규-`, `compliance-`, `audit-`, `contract-`, `계약-`

**spec** if any of:
- Path contains `drafts/harness-engineering/`, `docs/superpowers/specs/`, `docs/superpowers/plans/`
- Content mentions 3+ of: API, endpoint, architecture, requirement, user story, acceptance criteria, 아키텍처, 요구사항, 사양, 제안서, RFP, deliverable, milestone, 성과물
- Frontmatter `type: spec | plan | proposal`
- File name contains `spec-`, `plan-`, `proposal-`, `제안-`, `사양-`

**general** (fallback) for everything else — wiki entity/concept/synthesis pages, LinkedIn drafts, notes, reports that don't fit the two above.

**Axis 2 — Document subtype** (which checklist rows apply inside the reviewer). Subtype is passed to the reviewer regardless of dispatcher; the reviewer uses it to gate type-specific checklist items.

Detect subtype in this order. First match wins.

| Subtype | Signals |
|---|---|
| `entity` | Frontmatter `type: entity`; path `wiki/pages/` + wiki entity shape (헤딩: 인물/회사/발언/사건); filename starts with a proper noun |
| `concept` | Frontmatter `type: concept`; `wiki/pages/` with concept shape (definition · examples · cross-refs) |
| `synthesis` | Frontmatter `type: synthesis`; content explicitly crosses 2+ sources and derives a new claim |
| `comparison` | Frontmatter `type: comparison`; two-column or side-by-side structure comparing frameworks/products/approaches |
| `SOP` | Filename `sop-`, path `compliance/*/SOP*`, content "표준작업절차" / "Standard Operating Procedure"; frontmatter `type: sop` |
| `legal-memo` | Filename `legal-`, `법규-`, `법률검토-`; path `compliance/`; content "법률 검토", "Legal Opinion", "법적 쟁점" |
| `regulation-analysis` | Frontmatter `type: regulation-analysis`; 규정·고시 해석 중심, 조문별 적용 분석 구조. legal-memo와 구분: legal-memo는 사안에 대한 법적 의견, regulation-analysis는 규정 자체의 해석·체계 정리 |
| `audit-response` | Filename `audit-`, `감사-`, `tpqq-`; content가 질의-응답 쌍 구조, audit 지적 사항 대응 |
| `contract` | Filename `contract-`, `계약-`, `약관-`; content "제1조", "갑은 을에게", 서명란 |
| `proposal` | Filename `proposal-`, `제안-`; path `deliverables/*/proposal*`; frontmatter `type: proposal` |
| `plan` | Frontmatter `type: plan`; `docs/superpowers/plans/`; 단계적 실행 순서·마일스톤·체크포인트 구조. spec과 구분: spec은 "무엇을 만드는가", plan은 "어떤 순서로 만드는가" |
| `spec` | Frontmatter `type: spec`; content에 acceptance criteria·요구사항·user story 구조 |
| `architecture` | Filename `arch-`, `architecture-`; 구성도·다이어그램이 핵심이고 본문이 그 해설인 구조. spec과 구분: 요구사항보다 구조 자체가 주제 |
| `report` | Filename `report-`, `보고서-`, `현황-`; 기간 요약·상태 보고 성격 |
| `article` | `drafts/linkedin/`, LinkedIn 후보, op-ed·에세이 형식 |
| `general` | None of the above match — fallback |

When uncertain between two, pick the more specific one and mark confidence `low`.

**Subtype × Source modifier:** if subtype is `entity` or `concept` AND the primary source is a **강연 / 인터뷰 / 팟캐스트 / 영상 STT**, also tag `source:transcript`. This unlocks entity-specific rules around timestamps, STT editing markers, and speaker-time anchoring. Signals for `source:transcript`: frontmatter `sources` entry has `articles/` + audio-derived filename (e.g. `YYYYMMDD-*-강연.md`, `*-interview.md`, `*-transcript.md`), or content contains `(소스 L{line}~{line})` / `(hh:mm)` markers, or source file itself is a transcript.

### Step 3 — Dispatch to reviewer agent

Based on dispatcher type, call the matching agent via the Agent tool:

| Dispatcher type | Agent | `subagent_type` |
|---|---|---|
| meddev-compliance | `deliverable-meddev-compliance-reviewer` | (fall back to general-purpose only if the named agent isn't registered yet) |
| spec | `deliverable-spec-reviewer` | same |
| general | `deliverable-general-reviewer` | same |

Hand the agent a structured dispatch context:

```
DELIVERABLE REVIEW DISPATCH
- path: {{absolute path}}
- dispatcher_type: meddev-compliance | spec | general
- subtype: entity | concept | synthesis | comparison | SOP | legal-memo | regulation-analysis | audit-response | contract | proposal | plan | spec | architecture | report | article | general
- source_modifiers: [source:transcript] (if any)
- confidence: high | medium | low
- trigger: manual | wrap | explicit
- related_docs: [optional paths to RFP, contract, prior spec, source transcript, ...]
```

The reviewer will gate its static checklist on `subtype` — only rows whose `Type` column matches the detected subtype (or `all`) are active. `source:transcript` unlocks additional transcript-specific rows for entity/concept.

Do **not** pre-filter feedback memory here — the reviewer does that dynamically. The dispatcher only passes the structured context.

### Step 4 — Format the result

The reviewer returns a structured report. Present it to 사용자 as:

```
## Deliverable Review — {{filename}}
Reviewer: {{agent_name}}
Dispatcher type: {{meddev-compliance | spec | general}}
Subtype: {{entity/SOP/proposal/...}} ({{high/medium/low}})
Source modifiers: {{none | source:transcript}}
Trigger: {{manual/wrap/explicit}}
Feedback memory loaded: {{N}} entries
Checklist activated / skipped: {{k}} / {{m}} (type-gated)

### PASS ({{n}})
- ✅ {{item}}

### WARN ({{n}})
- ⚠️  {{item}} — {{reason}} [{{evidence_path}}:{{line}}]
  Related feedback: {{feedback_file}}

### FAIL ({{n}})
- ❌ {{item}} — {{reason}} [{{evidence_path}}:{{line}}]
  Related feedback: {{feedback_file}}
  Suggested fix: {{fix}}

### Recommendation
{{overall: ship / revise-minor / revise-major / block}}

### Candidate feedback to file
(optional, present only if the reviewer found a new failure pattern)

### Specialization signal
(optional, present only if the reviewer flags a domain that should graduate into its own specialized reviewer)
```

Surface WARN items prominently even when FAIL is zero — they're the ones that graduate into `feedback_*.md` next session if ignored. The reviewer may also surface a "subtype auto-detected" note at the top if the dispatcher didn't supply one; pass it through unchanged.

If the reviewer returned no FAIL items, still surface WARN items prominently — they're the ones that graduate into `feedback_*.md` next session if ignored.

## Reviewer Agent Contract

Each `deliverable-*-reviewer` agent must:

1. **Load feedback memory dynamically.** Glob `~/.claude/projects/<project-id>/memory/feedback_*.md`. Filter to verification-relevant entries (those describing a past verification failure, scope error, missed exception, misattribution, or premature conclusion). Read the top 5–15 by relevance.

   **Path resolution**: `~`은 사용자 홈(`$HOME` 또는 `$USERPROFILE`)으로 자동 확장된다. `<project-id>`는 현재 Claude Code 세션의 project hash로, CWD 기반으로 생성되어 Claude Code가 환경에서 해석한다. auto-memory가 비어 있거나 접근 불가하면 레포 내부 `memory/feedback_*.md`로 fallback (아래 "Failure Handling" 섹션 참조).

2. **Merge static + dynamic checklist.** Each agent has a domain-specific static checklist baked into its prompt. Merge it with the dynamic feedback-derived items. Deduplicate.

3. **Walk the file against the checklist.** For each item: PASS / WARN / FAIL with evidence (file line or feedback file path).

4. **Name the feedback source.** Every WARN or FAIL must cite which `feedback_*.md` or which static rule it came from. This is how 사용자 audits the reviewer itself.

5. **Suggest a concrete fix for each FAIL.** Not "revisit this section" — an actual edit direction.

6. **Flag new failure patterns.** If the reviewer notices a failure mode that isn't yet in feedback memory, end the report with `### Candidate feedback to file` — a short entry 사용자 can save as a new `feedback_*.md`.

## Growth Path

The general reviewer is the incubator. When the same failure class recurs 3+ times in general reviewer output, that class should graduate into its own specialized reviewer. 사용자 decides when to split.

Current roster:
- `deliverable-general-reviewer` — fallback + incubator
- `deliverable-meddev-compliance-reviewer` — 의료기기·법규·SOP·계약
- `deliverable-spec-reviewer` — 기술 spec·제안서·아키텍처 문서

Future candidates (do not build until pattern justifies):
- `deliverable-linkedin-reviewer` — voice/tone check for 사용자's LinkedIn posts
- `deliverable-wiki-reviewer` — cross-reference integrity, orphan detection

## Red Flags — STOP and run the full gate

These thoughts mean you're rationalizing your way around the check:

| Thought | Reality |
|---|---|
| "This file is small, skip the gate" | Small files are where scope errors hide. The gate takes 60 seconds. |
| "I already read the source carefully" | Past-사용자 said that exact sentence before `feedback_law_full_reading` got filed. |
| "The wrap skill will catch it" | wrap delegates to this skill. There is no other net. |
| "General reviewer is generic, it won't find anything" | That's a signal to strengthen the general reviewer, not to skip it. |
| "사용자 said it's ready, they know best" | 사용자 is the one who built this skill precisely because "ready" has been wrong before. |
| "The deliverable is in a language the reviewer doesn't handle well" | Then warn about low confidence in the report — don't silently skip. |

**No exceptions. If a file matches the trigger conditions, the gate runs. 사용자 can read a 10-line PASS report in 3 seconds; the cost of skipping is measured in new feedback entries.**

## Failure Handling

If the named reviewer agent is not yet registered in `~/.claude/agents/`:
1. Warn 사용자 once: "deliverable-{{type}}-reviewer not found, falling back to general-purpose agent with inline instructions"
2. Pass the same contract (load feedback memory, static + dynamic checklist, evidence-cited output) as an inline prompt to the general-purpose subagent
3. Note in the final report which reviewer was actually used

If the file path doesn't exist or is empty:
- Report and stop. Do not fabricate a review.

If feedback memory directory is missing:
- Proceed with static checklist only and note this degradation at the top of the report.
