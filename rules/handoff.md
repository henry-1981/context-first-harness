# rules/handoff.md

세션 간 작업 재개를 위한 자립 프롬프트 체계. 다중 프로젝트를 병행하는 작업 환경에서 맥락 유지와 병목 해소를 목적으로 한다.

## 핵심 개념

- **정의**: handoff는 "작업을 떠났을 때 머릿속에 있던 맥락 전체를 cold-start로 복원할 수 있는 자립 프롬프트"
- **목적**: 다음 세션 진입 시 사용자가 프롬프트를 다시 작성하는 병목 제거
- **원칙**: 살아 움직이는 시스템 — 생성 → 자동 스캔 → 조사·제안 → 사용자 결정 → 정리까지 라이프사이클 완결. 쓰기만 있는 저장소 금지 (기록의 저주 방지)

## 사용자 승인 원칙

- **완료·삭제 결정**은 반드시 사용자. Claude 자동 삭제 금지
- Claude 역할은 **조사·추정·권장 패키지 제공**까지. 최종 실행 명령은 사용자 승인 후
- Stale 추정이 "완료"로 나와도 파일 삭제 전 사용자 확인 필수
- 자동 실행 허용 범위: 감지(Hook), 증거 수집, 권장 옵션 제시

## 저장 위치 (2-location)

작업의 **물리적 좌표**로 판정한다.

- **모노레포 루트 작업** (스킬 개정, 크로스 프로젝트, 규칙 논의 등) → `drafts/handoffs/{name}.md`
- **프로젝트 내부 작업** (특정 프로젝트 폴더에서 진행) → `{project}/HANDOFF.md`

판정 예시:
- `.claude/skills/` 스킬 개정 → `drafts/handoffs/`
- 특정 프로젝트 내부 기능 추가 → `{project}/HANDOFF.md`
- 여러 프로젝트 엮는 작업 → `drafts/handoffs/`
- 외부 도구·vault 관련 (secall-vault 등, 직접 수정 제한된 영역) → `drafts/handoffs/`

## 파일 형식

### Frontmatter (최소 3필드)

```yaml
---
handoff: wiki-principle-3-verification
created: 2026-04-18
last_touched: 2026-04-18
stale_after: 14d
status: ready            # 필수 — ready | blocked | scheduled
unblock_when: ""         # blocked 시 필수 — 해제 조건 자연어
wake_date: ""            # scheduled 시 필수 — YYYY-MM-DD
session_owner: ""        # optional — 병렬 세션 소유권 (규약화 보류)
related_paths:
  - docs/superpowers/specs/2026-04-18-session-entry-ssot-design.md
---
```

- `handoff`, `created`, `last_touched`, `status`는 **필수**
- `status`는 `ready | blocked | scheduled` 중 하나 (§ 상태 전이 참조)
- `unblock_when`은 `status: blocked`일 때 필수 (해제 조건 자연어)
- `wake_date`는 `status: scheduled`일 때 필수 (YYYY-MM-DD)
- `stale_after`는 프로젝트 성격에 맞게 override (예: 장기 스펙은 `30d`)
- `related_paths`는 없어도 작동. Phase 1 조사 + hook orphan 체크 근거
- `session_owner`는 optional — 병렬 세션 동시 touch 실사례 관찰 후 규약화 판단

### 본문 구조 (자립 프롬프트 템플릿)

cold-start 복원이 가능한 수준까지 담는다. 최소 권장 섹션:

- **시작 방법**: 이 handoff를 어떻게 발동·실행하는지 한두 줄
- **배경**: 왜 이 작업이 필요한지, 계기가 된 세션·결정
- **참고 증거**: 커밋 해시, 메모리 파일, wiki 페이지, 관련 spec 링크
- **개정·개선 포인트**: 구체 쟁점 목록 (각 항목 현행·문제·개정 방향)
- **완료 기준**: 무엇이 만족되면 이 handoff가 끝났다고 볼지

## Spec-페어 handoff 패턴 (2026-04-18 신설)

큰 작업(설계 결정 5건 이상, 또는 deliverable-review 통과한 spec을 동반)은 **spec(영속 결정 박제) + handoff(일회성 작업 인계) 페어 구조**로 간다. 이 페어 구조에는 다음 규칙이 추가된다.

- **수명 분리**: spec은 `docs/superpowers/specs/` 또는 `{project}/specs/`에 영구 보존(변경 시 deliverable-review 재통과 필수). handoff는 작업 완료 시 `git rm`으로 소멸. git history가 archive
- **참조 비대칭**: handoff가 spec을 참조하는 단방향. spec은 handoff를 참조하지 않음 (spec 영속성 보호)
- **handoff 필수 첫 단계**: "시작 방법" 1번을 `**필수: spec 정독 없이 작업 시작 금지. 결정의 근거가 spec에만 있음**` 같은 BLOCKING 라벨로 강화. LLM 형식적 스킵 방지
- **frontmatter `related_paths`에 spec 경로 필수 포함**: cold-start hook이 자동으로 spec 위치 표면화하도록
- **다음 세션 진입 시 호출 패턴**: 사용자는 handoff 경로만 알려준다. spec은 handoff "시작 방법" 1번이 자동으로 끌고 온다 — 이게 잘 작동하는 게 이 패턴의 성공 기준

이 패턴을 채택한 첫 사례: `drafts/handoffs/onenote-notes-migration.md` ↔ `docs/superpowers/specs/2026-04-18-wiki-sources-definition-design.md`

## 상태 전이

status 필드는 다음 3종이며 전이 경로는 고정이다.

- `ready`: 즉시 재개 가능. fresh·stale 불문 hook이 진입 후보 섹션에 노출
- `blocked`: 외부 신호 대기. `unblock_when` 필수. hook은 휴면 섹션에 노출하되 진입 권장 X. 사용자가 unblock 신호를 세션 맥락에 언급하면 Claude가 ready 승격 제안
- `scheduled`: 날짜 도래 전 휴면. `wake_date` 필수. `wake_date ≤ today`면 hook이 진입 후보 섹션에 ready처럼 노출 (inline 처리, 실제 frontmatter는 계속 scheduled)

전이 경로:

```
ready ──blocked 지정──→ blocked
blocked ──unblock_when 충족──→ ready
ready ──scheduled 지정──→ scheduled
scheduled ──wake_date 도래──→ ready (hook inline 자동 처리)
any ──작업 폐기·완료──→ delete (git rm, 사용자 승인)
```

**Stale 처리 경로**: 상태와 무관하게 `last_touched + stale_after < today`이면 hook이 별도 `Stale` 섹션에 노출. `stale`은 **상태가 아니라 hook 감지 섹션 이름**이다. 사용자가 drill-down으로 renew(last_touched 갱신) / delete / 즉시 재개 결정.

**archive 폐지**: git log가 history를 유지하므로 별도 archive 폴더 없음. 완료·삭제는 `rm` + git commit으로 끝.

## 생성 트리거 (All-Route)

시점은 규정하지 않는다. 다음 경로 모두 허용.

| 트리거 | 주체 | 예시 |
|---|---|---|
| 사용자 명시 요청 | 사용자 | "이거 handoff로 저장해줘" |
| Claude 이탈 감지 제안 | Claude (사용자 승인) | "다른 프로젝트로 전환하시는데 handoff 남길까요?" |
| 작업 중단·미완료 인지 | 사용자 또는 Claude | 세션 중간, 작업 일부만 진행 후 보류 |
| wrap 스킬 세션 종료 경로 | wrap (선택적) | wrap 루틴에서 handoff 후보 제시 |

**wrap 단일 자동 갱신 원칙**: wrap은 handoff의 **유일한 자동 갱신 경로**이다. 사용자 명시 요청·Claude 이탈 감지·작업 중단 인지 3경로는 수동 생성 경로로 유지. handoff 체계 자체는 wrap 없이도 독립 작동(사용자 수동 생성 + hook 감지)하나, 자동 갱신은 wrap 경유 단일 채널.

## 세션 시작 스캔

### Hook 역할

**스크립트**: `.claude/hooks/session-start-handoff-scan.py` (SessionStart hook 등록)

책임 (결정론적 감지만):
- `drafts/handoffs/*.md` + `*/HANDOFF.md` glob 스캔
- 각 파일 frontmatter 파싱 (`handoff`, `created`, `last_touched`, `stale_after`, `status`, `unblock_when`, `wake_date`, `related_paths`)
- 4섹션 분류 후 markdown 주입 (stale 0건·ready 0건이어도 전체 silent 대신 해당 섹션 생략)

### 출력 4섹션

```markdown
## Handoff 진입 후보 (Ready + 깨어난 Scheduled)
- `path/to/foo.md` — ready | last_touched 2026-04-18
- `path/to/bar.md` — scheduled | wake_date 2026-04-18 (오늘 도래)

## Handoff — 휴면 (blocked / scheduled 미도래)
- `path/to/baz.md` — blocked | "티알 미팅 답변 수령"
- `path/to/qux.md` — scheduled | wake_date 2026-05-16

## Handoff — Stale
- `path/to/stale.md` — age 30d, stale_after 14d

## Handoff — 손상
- `path/to/broken.md` — frontmatter parse error: ...
```

### Sanity checks (경량)

- `status=ready`인데 `unblock_when` 공란 아님 → `⚠ inconsistency`
- `related_paths` 중 실제 존재 안 하는 경로 → `⚠ related_paths N건 없음` flag
- `status` 미기재 → default `ready` + `⚠ status 누락` 경고 노출
- `status=active` (legacy) → default `ready` + `⚠ status=active (legacy, ready로 해석)` 경고

모두 감지만. hook은 자동 수정 금지 (사용자 승인 원칙).

### 축약 규칙

각 섹션이 `TOP_DETAIL=3`건 초과 시 최근 touched 3건 상세 + 그 외 1줄 요약.

### Claude 역할

Hook이 주입한 분류 리스트를 받아 Phase 1~3 프로토콜을 실행한다. 진입 후보만 있으면 사용자에게 재개 옵션 제시, 휴면·Stale·손상은 감지 리포트 수준으로만 활용.

## 조사·제안 프로토콜

stale로 감지된 각 handoff에 대해 아래 Phase를 순서대로 실행한다. 사용자 개입은 Phase 3 이후 결정 단계에서만.

### Phase 1 — 6 신호 교차 조사

| # | 신호원 | 수집 내용 |
|---|---|---|
| 1 | git log | `last_touched` 이후 `related_paths` 또는 handoff 주제 관련 경로 커밋 유무 |
| 2 | memory | `~/.claude/projects/<project-id>/memory/`에서 handoff 주제 토큰 grep |
| 3 | wiki/log.md | `last_touched` 이후 관련 update/filing 기록 |
| 4 | CLAUDE.md / rules/ | handoff가 예고한 변경이 이미 반영됐는지 |
| 5 | secall-vault 세션 로그 | 다른 세션에서 해당 주제 처리 흔적 |
| 6 | resumed_count | 0이면 계획만 있고 착수 안 됨 신호 |

6개 전부 수행. 신호 없음도 유의미한 정보로 기록.

### Phase 2 — 상태 추정 (4분류)

조사 결과 조합으로 다음 4개 중 하나로 매핑:

- **완료 추정**: 관련 커밋·wiki log에 완료 흔적 → delete 권장
- **중단 추정**: 재개 0회 + 관련 활동 없음 → delete 또는 renew
- **지연 추정**: 계획 유효, 시점만 미정 → renew 권장
- **방향 전환 추정**: 원 계획과 다른 방향으로 진행됨 → 내용 수정 또는 재작성

### Phase 3 — 옵션·근거·권장 패키지

사용자에게 단일 메시지로 전달. 아래 출력 템플릿 엄수.

```
[Stale Handoff] {path}
생성 {created} ({age}일 경과) | last_touched {last_touched} | resumed_count {n}

[조사]
- git: {결과 요약 + 커밋 해시 또는 "변경 없음"}
- memory: {grep 결과 건수 + 관련 파일}
- wiki/log: {결과 요약}
- CLAUDE.md/rules/: {반영 여부}
- secall-vault: {관련 세션 여부}

[추정] {완료|중단|지연|방향 전환} — {근거 요약}

[옵션]
(1) delete — {이 옵션의 의미}
(2) renew +{stale_after} — {이 옵션의 의미}
(3) 즉시 재개 — {이 옵션의 의미}
★ 권장: ({번호}) {이유}

결정?
```

**대량 stale 처리** (4건 이상): 상위 3건 상세 + 나머지 1줄 요약 (`{name} — 추정 {상태}, 권장 {옵션}`). 사용자가 특정 항목 drill-down 요청 시 상세 조사 실행.

## 하위 호환 — Legacy status 처리

Migration 과도기(이 rules 개정 시점)의 기존 handoff 파일 중 `status: active`로 기재된 것은 신설 hook이 다음과 같이 처리한다.

- default `ready`로 간주해 진입 후보 섹션에 노출
- `⚠ status=active (legacy, ready로 해석)` 경고를 handoff 옆에 flag
- 사용자가 해당 handoff를 다음 touch 시 `ready | blocked | scheduled` 중 하나로 명시하면 경고 소멸

이 호환 로직은 영구 유지한다. 실제 trigger는 migration 완료 후 드물어지나, 외부 세션·병렬 사본에서 legacy 파일이 유입될 가능성을 차단하기 위함.

## 완화책 (Claude 의존성)

Claude 모델 변화·컨텍스트 포화로 인한 품질 드리프트를 제한한다.

- **규칙 구조화**: Phase 1~3과 출력 템플릿을 고정 스키마로 박제. 출력에서 빠진 항목이 즉시 눈에 보이게 함
- **주기 감사 (4주)**: `/repo-cleanup` 주기에 Claude 판단 샘플 3건 사용자 역검증. 드리프트 체크포인트
