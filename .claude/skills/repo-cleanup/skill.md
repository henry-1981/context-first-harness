---
name: repo-cleanup
description: Use when performing periodic 모노레포 정리 — 루트 폴더 찌꺼기, 흡수된 legacy 프로젝트, docs/ 이관 유물, 미사용 git 브랜치/stash/worktree를 스캔·분류·삭제할 때. Triggers: "/repo-cleanup", "리포 정리", "레포 정리", "폴더 정리", "주기 정리", "4주 정리", "찌꺼기 정리"
---

# Repo Cleanup

모노레포의 루트·docs·git 상태를 스캔해 방치된 산출물을 정리하는 주기 유지보수 워크플로우. 2~4주 주기로 실행.

## Context: 정리 대상이 쌓이는 경로

모노레포 작업에서는 프로젝트를 루트 레벨에서 인큐베이션(전체 레포 맥락)하다가 성숙 시점에 별도 프로젝트 폴더로 이관하는 패턴이 흔하다. 이관 후 루트의 원본·snapshot은 추적에서 벗어나 방치되며, 이 스킬은 그 방치분을 주기적으로 걷어내기 위한 것이다.

또한 superpowers 스킬을 쓰면 `docs/superpowers/specs/`, `docs/superpowers/plans/`에 산출물이 자동으로 쌓인다. `docs/ Convention`(루트 CLAUDE.md에 정의된 경우)에 따라 프로젝트 연결 시 원본을 프로젝트 폴더로 이동해야 하는데, 잊고 넘어가는 경우가 생긴다.

## 분류 축

스캔 결과를 다음 5축으로 분류한다.

### A) 쓰레기 / 로그 / 임시
- `*.log` 파일 (주로 `hwp_mcp_stdio_server.log`)
- 빈 폴더 (`output/` 같은)
- 정체불명 파일 (`무제.base`, `Pasted image *.png` 등)
- 환경 이관 아티팩트 (`claude-code-env-export.md`, `export-claude-env.md` — 이관 완료 후)
- wiki/rs-test-folder-* 같은 임시 테스트 폴더

### B) 상위 프로젝트에 흡수된 legacy
- 본인 CLAUDE.md에 "Legacy"·"deprecated" 명시
- 기능이 다른 폴더로 이관 완료 (예: `pdftomd/` → `md-hub`의 pdf-to-md 스킬)
- **규칙**: 최상위 프로젝트(흡수한 쪽)는 유지, 하위 legacy는 삭제
- **주의**: 외부 독립 레포(`.git` 있음)는 흡수 관계와 무관하게 유지

### C) 1회성 종료 프로젝트
- `tasks/` 폴더 비어 있음
- 수정일이 2주+ 이전
- memory(`~/.claude/projects/<project-id>/memory/`)에 완료/종료 표기
- 예: `research/mfds-ai-approval/` (통계 1회 조사), `compliance/cart-bp-insurance/` (검토 종료)

### D) docs/ 이관 유물
- `docs/plans/*.md`, `docs/superpowers/specs/*.md`, `docs/superpowers/plans/*.md`에 쌓인 프로젝트별 spec/plan
- 판정 기준: 해당 프로젝트 폴더에 최신본 존재 → 이관 유물(삭제), 없음 → 고아(삭제), 불분명 → D(사용자 판단 요청)
- 파일명의 `{project-name}` 토큰으로 연결 대상 추정 (예: `2026-03-24-presentation-v0.3-design.md` → `presentation/`)

### E) git 찌꺼기
- **브랜치**: `git rev-list --count main..<branch>` = 0 → 삭제 가능 (로컬 + 리모트)
- **Stash**: `git stash show` 내용 확인. main에 이미 반영됐거나 가치 없으면 drop. 미반영 라이브 변경이면 먼저 복구 후 drop
- **Worktree**: `git worktree list`로 확인, 사용 안 하는 것 제거. `.worktrees/` 디렉토리 잔재도 정리

## 유지 규칙 (절대 삭제 금지)

다음은 분류와 무관하게 유지한다:

1. **외부 독립 레포** — `.git` 있음
2. **사용자 명시 예정 작업 폴더** — memory에 "예정 작업", "다음 세션" 등 표기
3. **외부 도구 vault** — Obsidian·seCall 등 외부 앱이 쓰는 디렉토리 (예: `secall-vault/`, `.obsidian/`)
4. **활성 프로젝트** — memory에 active 표기, 최근 2주 내 수정
5. **레포 전체 메타 문서** — `docs/` 최상위의 환경 셋업·클론 체크리스트·CLI 가이드
6. **자동 미러** — `docs/claude-memory-backup/`, `docs/claude-skills-backup/` (git-tracked 미러)
7. **활성 프로젝트 폴더 내부** — 각 사용자의 프로젝트 하위 폴더. 루트 레벨 정리 범위 밖 (프로젝트 내부 정리는 해당 프로젝트의 CLAUDE.md 규약에 따름)

애매하면 반드시 사용자에게 물어본다. 추측으로 삭제하지 않는다.

## 워크플로우

### Phase 1: 탐색

모노레포 루트를 스캔해 의심 항목을 수집한다.

```bash
cd C:/Project

# 루트 최상위 파일·폴더
ls -la

# 각 폴더의 파일 수, 최종 수정일, CLAUDE.md 유무, .git 유무
# (node_modules 같은 거대 폴더로 인한 지연 주의 — find 쓸 때 prune 활용)

# docs/ 하위 파일 리스트
ls docs/ docs/plans/ docs/prompts/ docs/superpowers/specs/ docs/superpowers/plans/

# git 상태
git worktree list
git branch -a
git stash list
git status --short
```

루트 `*.log`, 정체불명 파일, 빈 폴더를 먼저 훑는다. 이후 각 하위 폴더의 CLAUDE.md를 간단히 읽어 Legacy·deprecated 표기 확인. docs/ 각 파일은 파일명에서 연결 프로젝트를 추정.

### Phase 2: 분류

수집한 항목을 A~E로 분류한다. 30개 이상이면 Explore 에이전트에 위임해 표로 받는다(토큰 효율). 각 항목에 대해:

1. **어느 축인지** (A/B/C/D/E)
2. **이관 대상 폴더가 존재하는지** (D 분류 시)
3. **프로젝트 폴더 안에서 같은 주제 파일이 있는지** (Grep/Glob 1회 탐색)
4. **유지 규칙 7개 중 하나에 해당하는지**
5. **불분명한 것은 "미해결"로 표시**

### Phase 3: 사용자 승인

분류 결과를 범주별로 정리해 제시한다:

```
### 삭제 대상
A) 쓰레기 (N개)
  - path1
  - path2
B) 흡수된 legacy (N개)
  - path1
...

### 유지 (참고용)
- path — 이유

### 미해결 / 사용자 판단 요청
- path — 왜 판단 필요한지
```

반드시 사용자 승인 후에만 Phase 4로 진입. 부분 승인 허용 (사용자가 특정 항목 예외 지정 가능).

### Phase 4: 삭제 실행

확정된 리스트를 `rm -rf` 일괄 삭제. 하나씩 묻지 않는다(사용자는 일괄 처리 선호). 삭제 후:
- `git status`로 결과 확인
- 빈 상위 폴더가 생기면 함께 제거
- 삭제된 파일 수 집계

### Phase 5: 커밋 — 선택적 staging

**중요**: 사용자의 진행 중 작업(untracked/modified)과 섞지 않는다. 내 cleanup 변경만 staging한다.

```bash
# 삭제된 경로만 explicit add (not git add -A)
git add <deleted-path-1> <deleted-path-2> ...

# wiki/log.md (아래 Phase 7에서 업데이트)
git add wiki/log.md

# 커밋 메시지는 conventional commit 한국어
git commit -m "chore: 주기 레포 정리 — <분류 요약> N files 삭제"
```

커밋 메시지에 Co-Authored-By Claude 포함.

### Phase 6: 사후 작업 — memory 업데이트

삭제한 항목과 연관된 memory 파일을 업데이트한다. 위치: `~/.claude/projects/<project-id>/memory/`

- 삭제된 프로젝트는 memory에 삭제 일자 + 사유를 간단히 남김 (파일 자체는 history로 보존)
- 완료된 프로젝트면 Active → Complete 카테고리로 인덱스 이동 (MEMORY.md)
- 스테일해진 참조(삭제된 폴더 경로 언급)는 수정

예:
```markdown
**2026-04-13 폴더 정리**: `C:/Project/pdftomd/` 레거시 폴더 삭제. 모든 로직은 md-hub + pdf-to-md 스킬로 이관 완료.
```

### Phase 7: 사후 작업 — wiki/log.md 기록

`C:/Project/wiki/log.md`에 상단 추가:

```markdown
## [YYYY-MM-DD] update | 주기 레포 정리

<삭제 요약 — 축별 개수, 주요 대상>

**유지 확정**: <예외 처리한 항목>
**관찰**: <다음 정리에 참고할 패턴이나 이슈>
```

### Phase 8: 푸시

```bash
rtk git push
```

최종 상태 확인 후 사용자에게 요약 리포트:
- 커밋 해시
- 파일/라인 삭제 수
- 남아있는 사용자 진행 중 작업 (참고용)

## 주의사항

### 절대 하지 말 것

- **`git add -A` 전체 스테이징** — 사용자의 미커밋 작업을 섞어버린다. 항상 explicit path.
- **추측 삭제** — CLAUDE.md나 memory를 확인하지 않고 "legacy처럼 보인다"고 삭제
- **외부 레포 삭제** — `.git` 있으면 반드시 유지
- **활성 프로젝트 건드리기** — 최근 2주 내 수정된 폴더는 일단 유지
- **Obsidian/외부 vault 삭제** — secall-vault, .obsidian 등 외부 앱 영역
- **force push** — 정리 후 push는 일반 push만

### 애매한 상황의 처리

- D(미해결)로 분류하고 사용자 판단 요청
- "삭제해도 별 문제 없을 것 같다"는 생각이 들면 이미 추측하고 있는 것. 확인 후 진행.
- memory 파일에 "active", "진행 중", "예정" 같은 표기가 있으면 무조건 유지

### 분리된 작업

- 사용자의 미커밋 변경(modified/untracked)은 **이 스킬 범위 밖**. 건드리지 않고 "남아있는 작업" 섹션에 참고로만 표시.
- 특정 프로젝트 내부 정리는 이 스킬 범위 밖. 루트 레벨만.

## 참고: 판단 패턴 예시

각 분류의 전형적 판단 근거:

| 항목 유형 | 분류 | 판단 근거 예시 |
|----------|------|---------------|
| Legacy 프로젝트 폴더 | B | 해당 폴더 CLAUDE.md에 "Legacy"·"deprecated" 명시, 기능이 다른 폴더로 이관 완료 |
| 1회성 스킬 산출물 | C | 스킬이 매번 폴더 재생성하거나 결과가 이미 다른 산출물에 반영됨 |
| 1회성 조사·검토 폴더 | C | tasks 비어 있음, 2주+ 무변동, memory에 "진행 중" 표기 없음 |
| 예정 작업 폴더 | 유지 | memory에 "예정 작업"·"다음 세션" 표기 |
| 외부 도구 vault | 유지 | Obsidian·seCall 등 외부 앱이 쓰는 디렉토리 |
| 외부활동 컨테이너 | 유지 | 강의·협의체·자문 등 외부활동 프로젝트 묶음 |
| 흡수한 상위 프로젝트 | 유지 | legacy를 흡수한 최상위 프로젝트는 유지 |
| docs/ superpowers 산출물 | D | 프로젝트 폴더에 최신본 존재 시 → 이관 유물(삭제), 미존재 시 → 고아(삭제), 불분명 → 사용자 판단 요청 |
| Merged feature 브랜치 | E | `git rev-list --count main..<branch>` = 0이면 삭제 가능 |
| Autostash | E | 내용 확인 후 라이브 변경은 복구, 이미 반영된 것은 drop |

## 실행 예상 시간

30분~1시간. 대부분의 시간은 Phase 1-3(탐색·분류·사용자 승인)에 쓰인다. Phase 4-8은 5-10분.

## 리마인더

schedule 시스템이 4주 주기 금요일 오전에 리마인더를 발송한다. 리마인더를 받으면 이 스킬을 `/repo-cleanup`으로 호출.
