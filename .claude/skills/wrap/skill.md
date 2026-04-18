---
name: wrap
description: Use when wrapping up a session, ending work, or user says "정리하자", "wrap", "세션 정리", "마무리". Commits, backs up memory, gives prompt feedback, records lessons, identifies handoff candidates, and saves next-session context.
---

# Wrap — Session Wrap-up

세션 종료 시 확정적 작업은 bash 스크립트, 판단 작업은 LLM 1회 패스로 처리.
에이전트 0개. **사용자에게는 최종 요약만 출력.**

## 실행 흐름

```
Phase 0+1: bash scripts/cleanup.sh (토큰 0)
  → 데이터 수집 + git commit + 메모리 백업 → JSON 반환

Phase 2: LLM 1회 패스 (메인 스레드)
  → JSON + 세션 맥락으로 동시 분석:
     피드백 / 레슨런 / 세션→Handoff 매핑 / wiki 변경 / filing / deliverable 검증

Phase 2.5: wrap-bias-reviewer single dispatch → 2.6 bias 자동 반영

Phase 3: 쓰기
  → lessons.md / CLAUDE.md / wiki filing / handoff touch/create/delete / state 갱신
  → 최종 요약 출력
```

## 다른 자동 경로와의 경계

wrap은 **세션 종료 시점**에만 동작한다. 아래 경로들은 각자의 자동 루틴이 돌아가므로 wrap에서 건드리지 않는다.

| 경로 | 담당 | wrap 접근 |
|------|------|----------|
| `wiki/raw/sessions/` | seCall 자동 인제스트 (대화 원재료) | 감지·편집 금지 |
| `wiki/wiki/` | seCall codex 파이프라인 (프로젝트·토픽 정리) | 감지·편집 금지 |
| `wiki/sources/` | 사용자 수동 소싱 | Phase 2-4에서 **diff만** 확인 |
| `wiki/pages/` | LLM filing (wrap 담당) | Phase 3-3에서 승격 |
| `drafts/handoffs/`, `*/HANDOFF.md` | handoff 라이프사이클 (SSOT) | Phase 2-3(세션→Handoff 매핑), Phase 3-4(touch/create/delete). Stale 감지는 session-start hook 담당 |

## Phase 0+1: 스크립트 실행

```bash
bash .claude/skills/wrap/scripts/cleanup.sh
```

스크립트가 반환하는 JSON:
```json
{
  "phase0": {
    "git_status": "...",
    "git_diff_stat": "...",
    "changed_files": "...",
    "git_log_since_sync": "...",
    "infra_changes": "...",
    "anchor_commit": "abc1234",
    "handoffs": [
      {
        "path": "drafts/handoffs/foo.md",
        "handoff": "foo-bar",
        "status": "ready",
        "last_touched": "2026-04-18",
        "wake_date": "",
        "unblock_when": "",
        "resumed_count": "0",
        "related_paths": ["docs/superpowers/specs/..."],
        "body_preview": "첫 400자..."
      }
    ]
  },
  "phase1": {
    "commits": ["메시지 (SHA)"],
    "backup": "완료 (SHA)" | "변경 없음"
  }
}
```

**백업 범위**: 프로젝트 메모리(`~/.claude/projects/<project-id>/memory/`)만. 스킬·에이전트는 모노레포에 직접 체크인되므로 별도 사본 불필요 (`.claude/scripts/backup-env.sh` 참조).

`handoffs`는 Phase 2-3 세션 → Handoff 매핑의 입력이다. `drafts/handoffs/*.md` + `*/HANDOFF.md`를 수집하며, handoff 디렉토리가 없거나 읽기 실패하면 빈 배열.

**스크립트 실패 시**: 에러 메시지를 JSON 대신 수신. 최종 요약에 "스크립트 실패" 표시 후 Phase 2로 진행.

## Phase 2: LLM 1회 분석

스크립트 JSON + 이번 세션 대화 맥락을 **1회 패스**로 동시에 분석한다. 별도 에이전트를 띄우지 않는다.

### 2-1. 프롬프트 피드백

3가지 패턴을 점검. 최대 3건 + 잘한 점 1건.

| 패턴 | 점검 기준 |
|------|----------|
| **지시어 없는 대명사** | "이건", "그거" 등 맥락 의존적 지칭 |
| **증상만 기술** | "안 돼", "이상해" 등 기대 상태 누락 |
| **암묵적 범위** | "나머지", "간단한" 등 범위 미지정 |

짧은 세션(프롬프트 < 3개)이면 스킵.

### 2-2. 레슨런

Claude Code가 잘못 접근→수정, 사용자 교정, 새 발견 등을 추출.

### 2-3. 세션 → Handoff 매핑

Phase 0+1이 수집한 `handoffs` 배열 + 이번 세션 맥락을 교차해 다음 4종 결정:

- **touch**: 기존 handoff 중 이번 세션에 진전이 있는 것 → `last_touched` 갱신 + body 섹션 보강 + status 전이 필요 시 대상 지정
- **create**: 신규 작업 이월 대상 → 신규 handoff 생성 (frontmatter + 자립 프롬프트 본문). 저장 위치는 `rules/handoff.md`의 2-location 규칙에 따름
- **delete**: 이번 세션에 명시적으로 완료된 handoff (git 커밋 SHA 증거 포함) → `git rm` 대상
- **status 전이**: `ready ↔ blocked ↔ scheduled` 전이 필요한 handoff → 변경 대상

저장 위치 판정·전이 의미·trigger 4가지는 `rules/handoff.md` 참조. 이 skill에서 규칙을 재서술하지 않는다.

**출력 payload**: Phase 2.5 dispatch 입력으로 사용되는 "2-3 초안" = touch/create/delete/전이 리스트. 각 항목에 대해 근거(세션 이벤트·커밋 SHA·사용자 결정 인용) 포함.

### 2-4. Wiki source 변경 점검

`phase0.changed_files`에 `wiki/sources/` 경로가 포함됐으면 각 파일의 **diff를 직접 확인한 뒤** 분류한다. mtime이나 git status만으로 인제스트 후속을 추천하지 않는다.

**범위 제한**: `wiki/sources/`만 본다. `wiki/raw/sessions/`와 `wiki/wiki/`는 secall이 담당하므로 감지 대상에서 제외한다.

분류 기준:
- **신규 파일** (페이지 없음) → 인제스트 후속 추천
- **기존 소스의 의미 있는 변경** (새 컨텐츠, 구조 수정, 사실 변경) → 인제스트 후속 추천. 페이지가 이미 있으면 "이전 인제스트 이후의 의미 변경"인지 추가 확인
- **오타·공백·메타데이터만** → 추천 스킵. 필요 시 원본 정정만 안내
- **판단 불가** → 추천하지 않고 "검토 필요"로 사용자에게 위임

결과는 2-3 다음 세션 추천에 반영한다 (`인제스트 후속: file-a, file-b — 이유`).

**Why:** mtime/status만 보고 추천하면 오타 1글자에도 인제스트 후속이 붙는다. 실제 사례 — 2026-04-13 wrap이 `github_zeude.md`의 `## Zeude` → `a## Zeude` 오타 변경을 인제스트 후속으로 추천.

### 2-5. Filing candidates

CLAUDE.md Wiki Convention의 **트리거 5가지**에 해당하는 인사이트를 식별:
1. 교차 비교 — 두 프레임워크·규정·접근법의 구조적 비교 → comparison
2. 신규 개념 — 기존 위키에 없는 개념·용어·패턴 등장 → concept
3. 종합 분석 — 여러 소스/페이지를 교차해 새 결론 도출 → synthesis
4. 의사결정 근거 — 향후 참조 가치 있는 선택의 논리 → concept
5. 반복 주제 — 같은 주제 2회 이상 → entity 또는 concept으로 승격

해당 시: 페이지명, 유형, 핵심 내용 요약, 교차 참조 대상을 추출.
해당 없으면: 빈 리스트.

**산출 경로 경계**: filing 결과물은 `wiki/pages/`에 저장한다. `wiki/wiki/` (secall codex 생성물)는 건드리지 않는다. 두 경로는 독립적으로 운영되며, `wiki/pages/`는 LLM이 필터링한 **지식 승격물**, `wiki/wiki/`는 codex가 만드는 **프로젝트·토픽 정리물**로 역할이 다르다.

### 2-6. Deliverable 검증 게이트

`phase0.changed_files`에서 **deliverable 후보**를 추출한다. 후보 기준:
- `drafts/**/*.md`, `deliverables/**/*.md`, `compliance/**/*.md`, `wiki/pages/**/*.md`
- 그 외 경로라도 외부 발송·클라이언트 제출 흔적이 세션 맥락에 있으면 후보

후보가 1개 이상이면 각각에 대해 `deliverable-review` skill을 호출한다. 호출 방식:
```
Skill(skill: "deliverable-review", args: "<absolute_file_path>")
```

별도 에이전트를 띄우지 않고 메인 스레드에서 순차 호출. 결과(PASS/WARN/FAIL 카운트 + Recommendation)를 메모리에 보관해 Phase 4 최종 출력에 포함.

**자동 호출 정책:**
- 후보 1–3개: 모두 자동 호출
- 후보 4개 이상: 가장 최근 수정된 3개만 자동 호출, 나머지는 "검증 미실행 — 수동 호출 권장" 목록으로 표시
- 후보 0개: 게이트 스킵

**FAIL이 1건이라도 있으면** 최종 출력 상단에 ⚠️ 마커를 노출하고, Recommendation이 `block`인 항목은 별도 강조. wrap이 끝났다고 해서 문서가 ship-ready인 것은 아님을 명확히 한다.

**수동 스킵:** 사용자가 wrap 호출 시 `/wrap --skip-review`를 명시했거나 직전 대화에서 "검증 건너뛰자"고 했으면 게이트 스킵, 출력에 "게이트 스킵됨" 표시.

**Why:** 반복되는 검증 실패형 feedback 누적을 차단하기 위한 사전 게이트. wrap이 트리거되는 시점 = 산출물이 외부로 나가기 직전 시점이므로 wrap 통합이 가장 자연스러움.

### 2.5. wrap-bias-reviewer dispatch

2-1·2-2·2-3 초안을 single subagent에 투입해 bias 교차 검증. 병렬 X.

입력 (main이 직접 조립해 투입):
- Phase 0-1 JSON
- 세션 요약 (key events + 사용자 결정 + 커밋 SHA 목록)
- **세션 마지막 10 사용자 메시지 원문** (메시지 단위, 각 최대 500자로 truncate)
- Phase 2 초안 JSON (2-1, 2-2, 2-3)

출력: JSON 배열 `[{section, severity, issue, fix}]`. 없으면 `[]`.

실패 처리: fallback 없음. Phase 4에 `🟡 Bias 검토 실패 — 수동 점검 권장` 1줄 기록 후 2.6 스킵.

### 2.6. Bias 자동 반영

reviewer 출력을 Phase 2 초안에 자동 반영.

**허용 (자동 적용)**:
- Section 2-1 피드백 워딩/인용 수정
- Section 2-2 레슨 워딩 교정
- Section 2-3 매핑의 metadata 수정 (unblock_when 문구 교정, body 섹션 보강 등)

**금지 (자동 금지, 사용자 확인 필요)**:
- Section 2-3 매핑의 status 전이 (ready↔blocked↔scheduled) 변경 — Phase 4에 "사용자 확인 요청" 1줄로 노출, 다음 wrap으로 지연
- create 신규 handoff 추가
- delete handoff 삭제

major·minor 전건 위 범위 내에서 자동 반영. 결과는 Phase 4의 `### Bias 교정 N건` 1줄로만 보고.

## Phase 3: 쓰기

Phase 2 분석 결과를 바탕으로 순차 실행. **중간 출력 없이 결과만 수집.**

### 3-1. lessons.md

레슨런이 있으면 `tasks/lessons.md`에 추가 + 커밋.

### 3-2. CLAUDE.md · rules

`phase0.infra_changes`에 변화가 있거나 세션 맥락에서 레포 공통 규칙·구조 변경이 확인되면 해당 `CLAUDE.md` 또는 `rules/*.md`를 업데이트 + 커밋. 판단과 실행을 여기서 한 번에 처리한다.

### 3-3. Wiki filing 실행

Filing candidates가 있으면:
1. `wiki/pages/`에 페이지 생성 또는 업데이트
   - frontmatter: `type`, `created`, `updated`, `sources: []`, `filed_from: session`
2. 관련 기존 페이지에 `[[filename]]` 교차 참조 추가
3. `wiki/index.md` 업데이트
4. `wiki/log.md`에 filing 기록: `## [YYYY-MM-DD] filing | 페이지 제목` + 트리거 명시

없으면 스킵. 부분 실패 시: 생성된 페이지는 유지하고 다음 lint에서 정리.

### 3-4. Handoff touch/create/delete

Phase 2-3에서 결정한 4종 액션을 **즉시 실행**. 사용자 응답 대기 없음. 취소는 사용자가 `git reset HEAD~`로 수행.

**touch** (기존 handoff 갱신):
- `last_touched` 필드를 오늘 날짜로 갱신
- body 섹션 보강 (시작 방법 / 배경 / 참고 증거 업데이트 필요 시)
- status 전이가 있으면 해당 필드 수정 (2.6에서 자동 금지였다면 skip, Phase 4에 노출)
- `git add` + 다음 3-5 state 커밋에 합류

**create** (신규 handoff):
- 저장 위치 판정 (모노레포 루트 작업 → `drafts/handoffs/`, 프로젝트 내부 → `{project}/HANDOFF.md`)
- frontmatter (handoff, created, last_touched, status, unblock_when/wake_date 필요 시, related_paths) + 자립 프롬프트 본문
- `git add` + 3-5에 합류

**delete** (완료 handoff):
- `git rm drafts/handoffs/{name}.md` 또는 `{project}/HANDOFF.md`
- 3-5에 합류

실행 중 실패(파일 없음, 권한 등) 시 해당 handoff만 skip + Phase 4에 실패 리포트.

### 3-5. State 파일 갱신

`tasks/wrap-state.json`의 `anchorUpdated`와 `anchorCommit`을 현재 시각·최신 HEAD SHA로 갱신 + 커밋.

## Phase 4: 최종 출력

**이 메시지만 사용자에게 보여준다. 그 전까지의 모든 과정은 출력하지 않는다.**

출력 순서는 **과거 → 박제·검증 → 학습 → 미래** 흐름. 이번 세션 한 일을 먼저 보고, 거기서 나온 박제·검증 결과를 확인한 뒤, 학습 포인트를 정리하고, 마지막으로 다음 세션 착수점에 도달.

```markdown
## Wrap 완료
{{검증 게이트에 FAIL 1건 이상이면 최상단에 ⚠️ Deliverable 검증 — N건 미해결, M건 block 권고}}

### 이번 세션
- 작업1 (`SHA` 또는 `SHA` 외 N개)
- 작업2 (`SHA`)
- 환경 백업 (메모리): 완료 (`SHA`) / 변경 없음 / 스킵

### Wiki filing
- N건 (page-a, page-b) — 또는 "없음"

### Deliverable 검증 게이트
- `path/to/file.md` — PASS 8 / WARN 1 / FAIL 0 → ship
- `path/to/other.md` — PASS 5 / WARN 2 / FAIL 1 → revise-major (feedback_law_full_reading)
- (없으면) 후보 0건 — 스킵
- (스킵됐으면) 사용자 요청으로 게이트 스킵됨

### Bias 교정
N건 반영 (major M / minor K) — 상세: {간단 요약}

### 레슨런
1. 제목: 설명

### 프롬프트 피드백
1. **패턴명**: "원문 인용" → `"개선된 표현"`
2. **잘한 점**: "원문 인용" — 이유

### Handoff 요약

touched N건 | created M건 | deleted K건 | 전이 L건

| 액션 | 경로 | 설명 |
|------|------|------|
| touch | `drafts/handoffs/foo.md` | status 그대로, body 갱신 |
| create | `drafts/handoffs/bar.md` (ready) | 이번 세션 P2 작업 이월 |
| delete | ~~`drafts/handoffs/baz.md`~~ | 완료 (커밋 abc1234) |
| 전이 | `drafts/handoffs/qux.md` (ready → blocked) | 티알 미팅 답변 대기 |

⚠ 사용자 확인 요청: (있으면) reviewer가 status 전이·create·delete를 제안했으나 자동 반영 금지 범위 — 사용자 수동 판정 필요
```

## 에러 처리

| 상황 | 처리 |
|------|------|
| cleanup.sh 실패 | "스크립트 실패" 표시, Phase 2는 세션 맥락만으로 진행 |
| git 변경 없음 | "변경 없음" 표시 |
| 짧은 세션 (< 3 프롬프트) | 피드백 "스킵" 표시 |
| lessons.md 없음 | 신규 생성 |
| Filing 부분 실패 | 생성된 페이지 유지, 최종 메시지에 "filing 부분 실패" 표시 |
| deliverable-review skill 미설치 | "검증 게이트 미설치" 표시, 게이트 스킵 |
| reviewer agent 미등록 | deliverable-review 내부에서 general-purpose fallback, 결과는 정상 수집 |
| 검증 게이트 FAIL 1건 이상 | 최종 출력 상단에 ⚠️ 마커 + 해당 파일 강조. wrap 완료가 ship-ready를 의미하지 않음을 명시 |
| 사용자 `--skip-review` | 게이트 스킵, 출력에 명시 |
| `handoffs`가 빈 배열 | "Handoff 없음" 표시, 2-3 매핑은 신규 create만 판단 |
| `handoffs` Python 실행 실패 | 스크립트가 빈 배열로 fallback. 원인 확인 필요 시 `PYTHONIOENCODING=utf-8 bash cleanup.sh` 수동 실행 |
| Phase 2.5 bias-reviewer 실패 | `🟡 Bias 검토 실패` 1줄 기록, 2.6 스킵, Phase 2 초안 그대로 Phase 3 진입 |
| Phase 3-4 handoff 파일 조작 실패 | 해당 handoff만 skip, Phase 4 Handoff 요약 테이블에 실패 표기 |
